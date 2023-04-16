const AWS = require('aws-sdk');
const dinosaur = new AWS.DynamoDB.DocumentClient();

exports.add_item = async event => {
    // const dynamoTable = os.environ['TABLE_NAME'];
    const dynamoTable = process.env.TABLE_NAME;
    console.log('table name: ', dynamoTable);
    console.log(event);
    // let json = JSON.parse(event.body);
    // const body = json['itemData'];
    const body = event.body['itemData'];
    console.log('body: ', body);
    const lastId = await getLatestID();
    console.log('last id was: ', lastId);
    const params = {
        Item: {
            item: 'grocery',
            id:  lastId + 1,
            name: body['name']
        },
        TableName : dynamoTable,
    };

    console.log('NEW ITEM: ', params);

    try {
        console.log('hello?');
        const data = await dinosaur.put(params, (err, data) => {
            if (err) console.log(err, err.stack);
            else console.log(data);
        }).promise();
        console.log(data);
        return { 
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify(data) 
        };
    } catch (err) {
        return err
    };

    

}

async function getLatestID() {
    const dynamoTable = process.env.TABLE_NAME;
    const params = {
        TableName : dynamoTable,
        item: 'grocery'
    }
    try {
        const data = await dinosaur.scan(params).promise();
        let response = data['Items'];
        let highestId = Math.max(...response.map(o => o.id));
        return highestId;
    } catch (err) {
        return err
    }
}