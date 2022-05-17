const { getPermissionsAggregationQuery, getRolesOfUser } = require('../../functions.js')

const { buildQuery } = require('../buildQuery.js')

module.exports = async (parent, args, context, info) => {
  const mongodb = context.mongodb

  let stages = []

  if (args.roots && Array.isArray(args.roots) && args.roots.length > 0) {
    stages = [
      ...stages,
      { $match: {
        _id: { $in: args.roots },
      }},
      ...getPermissionsAggregationQuery(context),
      { $graphLookup: {
          from: 'blocks',
          startWith: '$content.blockId',
          connectFromField: 'content.blockId',
          connectToField: '_id',
          as: 'children',
          maxDepth: 100,
          // depthField: 'depth',
      }},
      { $unwind: '$children' },
      { $replaceRoot: { newRoot: '$children' }}
    ]
  }

  let query = {}

  if (args.types && Array.isArray(args.types) && args.types.length > 0) {
    const types = args.types.filter(type => typeof type === 'string')
    query.type = { $in: types }
  }

  if (
    Array.isArray(args.ids) && args.ids.length > 0
    && Array.isArray(args.slugs) && args.slugs.length > 0
  ) {
    if (Object.keys(query).length > 0) {
      query = {
        $and: [
          {
            $or: [
              { _id: { $in: args.ids } },
              { 'properties.slug': { $in: args.slugs } },
            ],
          },
          query,
        ]
      }
    } else {
      query = {
        $or: [
          { _id: { $in: args.ids } },
          { 'properties.slug': { $in: args.slugs } },
        ],
      }
    }
  } else if (Array.isArray(args.ids) && args.ids.length > 0) {
    query = {
      ...query,
      _id: { $in: args.ids }
    }
  } else if (Array.isArray(args.slugs) && args.slugs.length > 0) {
    query = {
      ...query,
      'properties.slug': { $in: args.slugs }
    }
  }

  stages.push({ $match: query })



  if (args.hasOwnProperty('archived') && typeof args.archived === 'boolean') {
    if (args.archived === true) {
      stages.push({ $match: {
        'properties.archived': { $eq: true }
      } })
    } else {
      stages.push({ $match: {
        $or: [
          { 'properties.archived': { $exists: false } },
          { $and: [
            { 'properties.archived': { $exists: true } },
            { 'properties.archived': false },
          ]}
        ]
      } })
    }
  }

  stages = [
    ...stages,
    ...getPermissionsAggregationQuery(context),
    ...buildQuery(parent, args, context, info),
  ]
    
  const cursor = mongodb.collections.blocks.aggregate(stages)

  let blocks = await cursor.toArray()

  if (context.logged_in === true) {
    blocks = blocks.map(block => {
      if (!block.computed) {
        block.computed = {}
      }
      block.computed.roles = getRolesOfUser(context, block)
      return block
    })
  } else {
    // Remove permission infos from the blocks if not logged-in, to not leak user data.
    blocks = blocks.map(block => {
      if (!block.properties) {
        block.properties = {}
      }
      if (!block.computed) {
        block.computed = {}
      }
      block.computed.roles = ['viewer'] // getRolesOfUser doesn't make sense here, as we don't have a user.
      delete block.permissions
      delete block.computed.inherited_block_permissions
      return block
    })
  }

  return blocks
}
