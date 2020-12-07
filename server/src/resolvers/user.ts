import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from 'argon2';


@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver()
export class UserResolver {
    /**
     * Checks if the user is logged in and returns null if not or user info if true
     * @param em em context object
     * @param req req context object
     */
    @Query(() => User, {nullable: true})
    async me(
        @Ctx() { em, req }: MyContext
    ): Promise<User | null> {
        // checks if the user is logged in
        if (!req.session.userId)
            return null;

        return await em.findOne(User, { id: req.session.userId });
    }

    /**
     * Registers a new user
     * @param options Provided data to the register
     * @param em em context object
     */
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        // Check username length
        if (options.username.length <= 2)
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'length must be greater than 2'
                    }
                ]
            };
        
        // Check password length
        if (options.password.length <= 8)
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'length must be greater than 8'
                    }
                ]
            };
        
        // Hashing password
        const hashedPassword = await argon2.hash(options.password);
        
        // Creating user and persisting to the DB
        const user = await em.create(User, {
            username: options.username,
            password: hashedPassword
        });
        try {
            await em.persistAndFlush(user);
        } catch (error) {
            switch (error.code) {
                // Provided username is not unique
                case '23505':
                    return {
                        errors: [
                            {
                                field: 'username',
                                message: 'username is already taken'
                            }
                        ]
                    }
                default:
                    return {
                        errors: [
                            {
                                field: 'default',
                                message: 'please contact support'
                            }
                    ]
                }
            }
        }

        // store user id session
        // this will set a cookie on the user
        // keeps them logged in
        req.session.userId = user.id;

        return { user };
    }

    /**
     * Logs in an user
     * @param options Provided data to the register
     * @param em em context object
     * @param req req context object
     */
    @Query(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        // Verifying user exist
        const user = await em.findOne(User, { username: options.username });
        if (!user)
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'username does not exist'
                    }
                ]
            };

        // Validate password
        if (options.password === '' || options.password === 'undefined')
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'password can not be empty'
                    }
                ]
            };  
        
        // Checking password
        if (!await argon2.verify(user.password, options.password))
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'password do not match'
                    }
                ]
            };

        // store user id session
        // this will set a cookie on the user
        // keeps them logged in
        req.session.userId = user.id;

        return { user };
    }
}
