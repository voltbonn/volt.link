const { gql } = require('apollo-server-express')

// scalar Date
// scalar Time
// scalar DateTime
//
// scalar Timestamp

const schema = gql`
	scalar JSON
	scalar JSONObject
	scalar DateTime
	scalar ObjectID

	type Query {
		id: ObjectID

		block(_id: ObjectID!): Block
		blocks(ids: [ObjectID], types: [String], archived: Boolean, roots: [ObjectID]): [Block]
		all_subblocks(_id: ObjectID!): [Block]
		blockBySlug(slug: String!): Block
		self: User
		parentBlocks(_id: ObjectID!): [Block]
		siblingBlocks(_id: ObjectID!, types: [String]): [Block]
		blockMatchesRoles(_id: ObjectID!, roles: [String]): Boolean
		checkSlug(slug: String!): SlugInfos
	}

	type Mutation {
		saveBlock(block: InputBlock!): ObjectID
		archiveBlock(_id: ObjectID!): Boolean
		unarchiveBlock(_id: ObjectID!): Boolean
		moveBlock(movingBlockId: ObjectID!, newParentId: ObjectID!, newIndex: Int!): Boolean
	}

	type SlugInfos {
		isOkay: Boolean
		errors: [String]
	}

	type User {
		user: JSONObject
		logged_in: Boolean
		blockId: ObjectID
		userroles: [String]
	}

	type Metadata {
		modified: DateTime
		modified_by: String
	}

	enum BlockType {
		person
		page
		headline
		text
		button
	}

	type ContentConfig {
		blockId: ObjectID
		block: Block
	}

	type Computed {
		roles: [String]
		sort: Int
		inherited_block_permissions: JSON
	}

	type Block {
		_id: ObjectID
		type: String
		properties: JSON
		content: [ContentConfig]
		parent: ObjectID
		metadata: Metadata
		permissions: JSON
		computed: Computed
	}

	type Permission {
		email: String
		role: String
	}

	input InputContentConfig {
		blockId: ObjectID
	}

	input InputBlock {
		_id: ObjectID
		type: String
		properties: JSON
		content: [InputContentConfig]
		parent: ObjectID
		metadata: JSON
		permissions: JSON
		computed: JSON
	}





	enum IconType {
		url
		emoji
		file
	}
	type Icon {
		type: IconType
		url: String
		emoji: String
		fileId: ObjectID
	}

	enum PhotoType {
		url
		file
	}
	type Photo {
		type: PhotoType
		url: String
		fileId: ObjectID
	}

	type CommonProperties {
		text: String
		icon: Icon
		coverphoto: Photo
  	imprint: String
  	privacy_policy: String
	}
`

module.exports = schema
