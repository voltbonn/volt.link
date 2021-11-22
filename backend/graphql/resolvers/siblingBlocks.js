const { getPermissionsQuery } = require('../functions.js')

module.exports = async (parent, args, context, info) => {
	const mongodb = context.mongodb

	return new Promise((resolve,reject)=>{
			if (args._id && mongodb.ObjectID.isValid(args._id)) {
    		const cursor = mongodb.collections.blocks.aggregate([
					{ $match: {
						_id: new mongodb.ObjectID(args._id),
						...getPermissionsQuery(context),
					} },
    			{ $lookup: {
    			   from: 'blocks',
    			   localField: 'parent',
    			   foreignField: 'parent',
    			   as: 'siblings',
    			} },
    			{ $unwind : '$siblings' },
    			{ $replaceRoot: { newRoot: '$siblings' } },
					{ $match: getPermissionsQuery(context) },
    		])

      	resolve(cursor.toArray())
			} else {
				reject('missing _id variable in graphql query or _id is not a correct mongoDB')
			}
	})
}
