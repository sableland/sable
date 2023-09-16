use imara_diff::{
    intern::{InternedInput, Interner, Token},
    Sink,
};
use owo_colors::OwoColorize;
use std::{fmt::Write, ops::Range};

pub struct PrettyDiffBuilderConfig {
    pub lines_before_diff: u32,
    pub lines_after_diff: u32,
    pub print_first_and_last_lines: bool,
}

// Custom diff builder to create pretty diffs
// Modified version of UnifiedDiffBuilder
pub struct PrettyDiffBuilder<'a> {
    before: &'a [Token],
    after: &'a [Token],
    interner: &'a Interner<&'a str>,

    lines_before_diff: u32,
    lines_after_diff: u32,

    pos: u32,
    before_hunk_start: u32,
    after_hunk_start: u32,
    before_hunk_len: u32,
    after_hunk_len: u32,

    buffer: String,
    dst: String,
}

impl<'a> PrettyDiffBuilder<'a> {
    pub fn new(input: &'a InternedInput<&str>, config: PrettyDiffBuilderConfig) -> Self {
        Self {
            lines_before_diff: config.lines_before_diff,
            lines_after_diff: config.lines_after_diff,
            pos: 0,
            before_hunk_start: 0,
            before_hunk_len: 0,
            after_hunk_start: 0,
            after_hunk_len: 0,
            buffer: String::with_capacity(8),
            dst: String::new(),
            interner: &input.interner,
            before: &input.before,
            after: &input.after,
        }
    }
}

impl<'a> PrettyDiffBuilder<'a> {
    fn print_tokens(&mut self, tokens: &[Token], prefix: char) {
        let buffer = &mut self.buffer;
        for &token in tokens {
            let message = match prefix {
                '+' => format!("{prefix}{}", self.interner[token])
                    .green()
                    .bold()
                    .to_string(),
                '-' => format!("{prefix}{}", self.interner[token])
                    .red()
                    .bold()
                    .to_string(),
                _ => format!("{prefix}{}", self.interner[token])
                    .bright_black()
                    .to_string(),
            };

            writeln!(buffer, "{}", message).unwrap()
        }
    }

    fn flush(&mut self) {
        if self.before_hunk_len == 0 && self.after_hunk_len == 0 {
            return;
        }

        let end = (self.pos + self.lines_after_diff).min(self.before.len() as u32);
        self.update_pos(end, end);

        write!(&mut self.dst, "{}", &self.buffer).unwrap();
        self.buffer.clear();
        self.before_hunk_len = 0;
        self.after_hunk_len = 0
    }

    fn update_pos(&mut self, print_to: u32, move_to: u32) {
        self.print_tokens(&self.before[self.pos as usize..print_to as usize], ' ');
        let len = print_to - self.pos;
        self.pos = move_to;
        self.before_hunk_len += len;
        self.after_hunk_len += len;
    }
}

impl Sink for PrettyDiffBuilder<'_> {
    type Out = String;

    fn process_change(&mut self, before: Range<u32>, after: Range<u32>) {
        if before.start - self.pos > self.lines_before_diff {
            self.flush();
            self.pos = before.start - self.lines_before_diff;
            self.before_hunk_start = self.pos;
            self.after_hunk_start = after.start - self.lines_before_diff;
        }

        self.update_pos(before.start, before.end);
        self.before_hunk_len += before.end - before.start;
        self.after_hunk_len += after.end - after.start;
        self.print_tokens(
            &self.before[before.start as usize..before.end as usize],
            '-',
        );
        self.print_tokens(&self.after[after.start as usize..after.end as usize], '+');
    }

    fn finish(mut self) -> Self::Out {
        self.flush();
        self.dst
    }
}
