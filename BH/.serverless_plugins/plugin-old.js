const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');
const Lambda = new AWS.Lambda({region: 'us-east-1'});

// Class: LambdaInvoker
// Summary: Prepares lifecycle hooks and commands for plugin
class LambdaInvoker {
  constructor(serverless, options) {

    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');

    this.commands = {
      s3deploy: {
        usage: 'Deploy assets to S3 bucket',
        lifecycleEvents: [
          'deploy'
        ],
        options: {
          bucket: {
            usage: 'Limit the deploy to a specific bucket',
            shortcut: 'b'
          }
        }
      }
    };

    this.hooks = {
      'after:deploy:finalize': () => Promise.resolve().then(this.seedAndInvoke.bind(this))
    };
  }

  log(message) {
    this.serverless.cli.log(message);    
  }

  // Function: uploadFile
  // Summary: Prepares JSON data, Calls uploadFile to upload JSON to S3, Invokes Lambda function
  seedAndInvoke() {  

    let bucketName = this.serverless.service.custom.SOURCE_BUCKET_NAME
    let fileName = this.serverless.service.custom.FILENAME
    let functionName = this.serverless.service.custom.READANDCOPY_FUNCTION_NAME

    let id = uuidv4();

    this.log(id)

    let data = {
      "id": id,
      "name": "Fiona",
      "species": "Pigmy",
      "location": "Sacramento Zoo",
      "food": "Watermelon"
    }

    this.uploadFile(JSON.stringify(data), fileName, bucketName).then(r=>{}).catch(e=>{})

    var params = {
      FunctionName: functionName
    };
     
    Lambda.invoke(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  }


  // https://stackoverflow.com/questions/53480547/upload-json-file-to-aws-s3-bucket-from-aws-sdk-in-node-js
  // Function: uploadFile
  // Summary: Prepares JSON data to be uploaded to S3
  uploadFile(file, file_name, bucket, path = '/defualt') {
    return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(file) || (file && Buffer.isBuffer(file.buffer)) || String(file_name).includes('.json') || file.indexOf('data:') === 0) {
            file = Buffer.isBuffer(file) ? file : String(file_name).includes('.json') ? file : file.indexOf('data:') === 0 ? new Buffer(img_src.replace(/^data:\w+\/\w+;base64,/, ""), 'base64') : file.buffer;

            var data = {
                Key: file_name,
                Body: file,
                Bucket: bucket,
                CacheControl: 'no-cache'
            };

            if (file.indexOf('data:') === 0) {
                data['ContentType'] = String(file).substr(file.indexOf('data:') + 'data:'.length, file.indexOf(';'))
            } else if (String(file_name).includes('.json')) {
                data['ContentType'] = 'application/pdf';
            }

            S3.putObject(data, function (err, data) {
                if (err) {
                    console.log('Error uploading data: ', err);
                    return reject(err);
                } else {
                    return resolve({
                        name: file_name,
                        path: path
                    });
                }
            });
        } else {
            return reject('File is required');
        }
    });
  }
}

module.exports = LambdaInvoker;
