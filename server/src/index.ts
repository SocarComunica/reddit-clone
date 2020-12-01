import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import {buildSchema} from "type-graphql";
import {PostResolver} from "./resolvers/post";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver],
            validate: false,
        }),
        context: () => ({em: orm.em})
    });

    apolloServer.applyMiddleware(({ app }));

    app.listen(4000, () => {
        console.log('Server listening on http://localhost:4000');
    });
};

main().catch((error) => {
    console.error(error);
});
