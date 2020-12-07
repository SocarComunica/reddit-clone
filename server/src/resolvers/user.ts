import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, Query, Resolver } from "type-graphql";
import argon2 from 'argon2';


@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@Resolver()
export class UserResolver {
    @Mutation(() => User)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<User> {
        // Hashing password
        const hashedPassword = await argon2.hash(options.password);
        
        // Creating user and persisting to the DB
        const user = await em.create(User, {
            username: options.username,
            password: hashedPassword
        });
        await em.persistAndFlush(user);

        return user;
    }

    @Query(() => User, {nullable: true})
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<User | null> {
        // Verifying user exists
        const user = await em.findOne(User, { username: options.username });
        if (!user)
            return null;
        
        // Checking password
        if (await argon2.verify(user.password, options.password))
            return user;
        
        return null;
    }
}