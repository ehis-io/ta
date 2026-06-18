const { createHandler } = require('@app-core/server');

module.exports = createHandler({
  path: '/',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card microservice is up and running.',
      data: {
        service: process.env.APP_NAME || 'CreatorCardService',
        status: 'ok',
        endpoints: {
          create_card: 'POST /creator-cards',
          get_card: 'GET /creator-cards/:slug',
          delete_card: 'DELETE /creator-cards/:slug',
        },
      },
    };
  },
});
