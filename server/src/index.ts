import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import session from 'express-session';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from './resolvers/user';
import redis from 'redis';
import connectRedis from 'connect-redis';
import { __prod__ } from './constants';
import { MyContext } from './types';

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();

    const app = express();

    const redisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
            name: 'qid',
            store: new redisStore({
                client: redisClient,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // max age set to 10 years
                httpOnly: true,                         // cookie only available for requests
                sameSite: 'lax',                        // csrf
                secure: __prod__,                       // cookie only works on https
            },
            saveUninitialized: false,
            secret: 'keyboard cat',
            resave: false
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [
                PostResolver,
                UserResolver
            ],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({em: orm.em, req, res})
    });

    apolloServer.applyMiddleware(({ app }));

    app.listen(4000, () => {
        console.log('Server listening on http://localhost:4000');
    });
};

main().catch((error) => {
    console.error(error);
});
