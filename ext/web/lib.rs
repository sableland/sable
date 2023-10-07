use deno_core::error::range_error;
use deno_core::error::type_error;
use deno_core::v8;
use deno_core::U16String;
use deno_core::{error::AnyError, op2};
use encoding_rs::CoderResult;
use encoding_rs::DecoderResult;
use encoding_rs::Encoding;

#[op2]
#[string]
pub fn op_encoding_normalize_label(#[string] label: String) -> Result<String, AnyError> {
    let encoding = Encoding::for_label_no_replacement(label.as_bytes()).ok_or_else(|| {
        range_error(format!(
            "The encoding label provided ('{label}') is invalid."
        ))
    })?;
    Ok(encoding.name().to_lowercase())
}

#[op2]
pub fn op_encoding_decode_utf8<'a>(
    scope: &mut v8::HandleScope<'a>,
    #[anybuffer] zero_copy: &[u8],
    ignore_bom: bool,
) -> Result<v8::Local<'a, v8::String>, AnyError> {
    let buf = &zero_copy;

    let buf = if !ignore_bom && buf.len() >= 3 && buf[0] == 0xef && buf[1] == 0xbb && buf[2] == 0xbf
    {
        &buf[3..]
    } else {
        buf
    };

    match v8::String::new_from_utf8(scope, buf, v8::NewStringType::Normal) {
        Some(text) => Ok(text),
        None => Err(type_error("buffer exceeds maximum length")),
    }
}

#[op2]
#[serde]
pub fn op_encoding_decode_single(
    #[anybuffer] data: &[u8],
    #[string] label: String,
    fatal: bool,
    ignore_bom: bool,
) -> Result<U16String, AnyError> {
    let encoding = Encoding::for_label(label.as_bytes()).ok_or_else(|| {
        range_error(format!(
            "The encoding label provided ('{label}') is invalid."
        ))
    })?;

    let mut decoder = if ignore_bom {
        encoding.new_decoder_without_bom_handling()
    } else {
        encoding.new_decoder_with_bom_removal()
    };

    let max_buffer_length = decoder
        .max_utf16_buffer_length(data.len())
        .ok_or_else(|| range_error("Value too large to decode."))?;

    let mut output = vec![0; max_buffer_length];

    if fatal {
        let (result, _, written) =
            decoder.decode_to_utf16_without_replacement(data, &mut output, true);
        match result {
            DecoderResult::InputEmpty => {
                output.truncate(written);
                Ok(output.into())
            }
            DecoderResult::OutputFull => Err(range_error("Provided buffer too small.")),
            DecoderResult::Malformed(_, _) => Err(type_error("The encoded data is not valid.")),
        }
    } else {
        let (result, _, written, _) = decoder.decode_to_utf16(data, &mut output, true);
        match result {
            CoderResult::InputEmpty => {
                output.truncate(written);
                Ok(output.into())
            }
            CoderResult::OutputFull => Err(range_error("Provided buffer too small.")),
        }
    }
}
