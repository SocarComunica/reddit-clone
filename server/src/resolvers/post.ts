import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";

@Resolver()
export class PostResolver {
  /**
   * Finds all the posts
   * @returns {Post[]} an array of posts
   */
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  /**
   * Finds one post
   * @param {number} id
   * @param {em} em
   * @returns {Post|null}
   */
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  /**
   * Creates a new post
   * @param {string} title
   * @param {em} em
   * @returns {number} id of the new post
   */
  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title: title });
    await em.persistAndFlush(post);
    return post;
  }

  /**
   * Updates a post if exists
   * @param {number} id
   * @param {string} title
   * @param {em} em
   * @returns {Post}
   */
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) return null;

    if (title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  /**
   * Deletes a post if exists
   * @param {number} id
   * @param {em} em
   * @returns {boolean}
   */
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    const post = await em.findOne(Post, { id });
    if (!post) return false;

    await em.removeAndFlush(post);
    return true;
  }
}
