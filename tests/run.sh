# Loop over all files in tests that end with .test.js
for file in ./tests/*.test.js; do
    if [ -f $file ]; then
        # Run that test with `bueno test`
        target/debug/bueno test $file;
        # If exit code of that test wasn't 0, exit with 1
        if [ $? != 0 ]; then
            exit 1;
        fi;
    fi;
done;