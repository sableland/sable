use deno_core::{op2, v8};
use imara_diff::{
    diff,
    intern::{InternedInput, Interner, Token},
    Algorithm, Sink,
};
use owo_colors::OwoColorize;
use std::{fmt::Write, ops::Range, time::Instant};

const NS_IN_MS: f64 = 1e+6;

// Custom diff builder to create pretty diffs
// Modified version of UnifiedDiffBuilder
pub struct PrettyDiffBuilder<'a> {
    before: &'a [Token],
    after: &'a [Token],
    interner: &'a Interner<&'a str>,

    pos: u32,
    before_hunk_start: u32,
    after_hunk_start: u32,
    before_hunk_len: u32,
    after_hunk_len: u32,

    buffer: String,
    dst: String,
}

impl<'a> PrettyDiffBuilder<'a> {
    pub fn new(input: &'a InternedInput<&str>) -> Self {
        Self {
            before_hunk_start: 0,
            after_hunk_start: 0,
            before_hunk_len: 0,
            after_hunk_len: 0,
            buffer: String::with_capacity(8),
            dst: String::new(),
            interner: &input.interner,
            before: &input.before,
            after: &input.after,
            pos: 0,
        }
    }
}

impl<'a> PrettyDiffBuilder<'a> {
    pub fn with_writer(input: &'a InternedInput<&str>, writer: String) -> Self {
        Self {
            before_hunk_start: 0,
            after_hunk_start: 0,
            before_hunk_len: 0,
            after_hunk_len: 0,
            buffer: String::with_capacity(8),
            dst: writer,
            interner: &input.interner,
            before: &input.before,
            after: &input.after,
            pos: 0,
        }
    }

    fn print_tokens(&mut self, tokens: &[Token], prefix: char) {
        let buffer = &mut self.buffer;
        for &token in tokens {
            let message = match prefix {
                '+' => format!("{prefix}{}", self.interner[token])
                    .green()
                    .to_string(),
                '-' => format!("{prefix}{}", self.interner[token])
                    .red()
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

        let end = (self.pos + 3).min(self.before.len() as u32);
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
        if before.start - self.pos > 6 {
            self.flush();
            self.pos = before.start - 3;
            self.before_hunk_start = self.pos;
            self.after_hunk_start = after.start - 3;
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

/*
Benchmark given function

It actually benchmarks that function twice:
 - first to warmup the function and break potential JIT bias
 - second run is the one that gets returned

It confirms that results are stable by checking the difference
between current function call and the average is smaller than 5e-6 (500NS)

Returns a number in milliseconds with nanosecond precision
Which means how long one run of that function takes */
#[op2]
pub fn op_bench_fn(scope: &mut v8::HandleScope, func: &v8::Function) -> f64 {
    let recv = v8::Integer::new(scope, 1).into();
    let args = &[];

    let mut avg: f64 = 0.0;
    let mut time: f64;

    for _ in 0..2 {
        avg = 0.0;
        time = 1.0;

        while (time - avg).abs() > 5e-6 * time {
            let now = Instant::now();
            func.call(scope, recv, args);
            time = now.elapsed().as_nanos() as f64;

            avg = (avg + time) / 2.0;
        }
    }

    avg as f64 / NS_IN_MS
}

#[op2]
#[string]
pub fn op_diff_str(#[string] before: &str, #[string] after: &str) -> String {
    let input = InternedInput::new(before, after);
    let diff_builder = PrettyDiffBuilder::new(&input);

    diff(Algorithm::Histogram, &input, diff_builder)
}
