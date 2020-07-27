'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const DynamoDoc = new AWS.DynamoDB.DocumentClient();

module.exports = {
  readAndCopy: async(event, context) => {
    let dynamoTableName = process.env.DYNAMODB_HIPPO_TABLE
    let sourceBucket = process.env.SOURCE_BUCKET_NAME
  
    let bucketParams = {
      Bucket: sourceBucket
    }
    
    let s3Objects

    try {
       s3Objects = await S3.listObjectsV2(bucketParams).promise();
       console.log(s3Objects)
    } catch (e) {
       console.log(e)
    }
  
    let s3ObjectsJSONString = JSON.stringify(s3Objects)

    console.log(s3ObjectsJSONString)

    let s3JSON = JSON.parse(s3ObjectsJSONString)
    
    console.log('s3ObjectsJSONString',s3JSON.Contents[0])
    
    let getParams = {
      Bucket: sourceBucket,
      Key: s3JSON.Contents[0].Key
    };
    
    let s3Obj = await S3.getObject(getParams).promise()
    let jsonS3Object = JSON.parse(s3Obj.Body.toString());
    
    console.log('here is my s3 object Im trying to upload', jsonS3Object)
    
    var putParams = {
      TableName: dynamoTableName,
      Item: {
        id: jsonS3Object.id,
        name: jsonS3Object.name,
        species: jsonS3Object.species,
        location: jsonS3Object.location,
        food: jsonS3Object.food
      }
    };
    
    try {
      let dynamodb = new AWS.DynamoDB.DocumentClient()
      let result = await dynamodb.put(putParams).promise()
    } catch (putError) {
      console.log(putError)
      return {
        statusCode: 500
      }
    }
  }
}


