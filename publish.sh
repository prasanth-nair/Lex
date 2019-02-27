rm -rf ./lambda/*
cp sentiment.js ./lambda
cp index.js ./lambda
cp session.js ./lambda
cd lambda 
zip  index.zip * -X -r
aws lambda update-function-code --function-name lex-aig-quote --zip-file fileb://index.zip
cd ..