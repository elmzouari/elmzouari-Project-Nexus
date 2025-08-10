// In-memory demo DB with users, polls, votes, and comments.

import { v4 as uuidv4 } from "uuid"
import SHA256 from "crypto-js/sha256"

export type Role = "admin" | "user"

export interface User {
  id: string
  email: string
  passwordHash: string
  salt: string
  role: Role
  createdAt: string
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  startDate: string
  endDate: string
  type: "single-choice" | "multi-select"
  categories?: string[]
  createdAt: string
}

export interface Comment {
  id: string
  pollId: string
  userId: string
  author: string
  text: string
  createdAt: string
  likes: number
}

type GlobalDB = {
  users: User[]
  polls: Poll[]
  comments: Comment[]
  // pollId -> Map<userId, optionIds[]>
  votesByPoll: Map<string, Map<string, string[]>>
  // commentId -> Set<userId> who liked
  commentLikes: Map<string, Set<string>>
  seeded: boolean
}

const g = globalThis as any
if (!g.__DB__) {
  g.__DB__ = {
    users: [],
    polls: [],
    comments: [],
    votesByPoll: new Map<string, Map<string, string[]>>(),
    commentLikes: new Map<string, Set<string>>(),
    seeded: false,
  } as GlobalDB
}
const db = g.__DB__ as GlobalDB
;(function seed() {
  if (db.seeded) return
  // Admin user: admin@example.com / admin123
  const adminEmail = "admin@example.com"
  const salt = uuidv4()
  const passwordHash = SHA256("admin123" + salt).toString()
  const adminId = uuidv4()
  db.users.push({
    id: adminId,
    email: adminEmail,
    passwordHash,
    salt,
    role: "admin",
    createdAt: new Date().toISOString(),
  })

  const now = Date.now()

  db.polls.push(
    {
      id: "poll-1",
      question: "What is your favorite programming language?",
      options: [
        { id: "opt-1-1", text: "JavaScript", votes: 15 },
        { id: "opt-1-2", text: "Python", votes: 10 },
        { id: "opt-1-3", text: "TypeScript", votes: 20 },
        { id: "opt-1-4", text: "Java", votes: 5 },
      ],
      startDate: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      type: "single-choice",
      categories: ["Programming"],
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "poll-2",
      question: "Which framework do you prefer for web development?",
      options: [
        { id: "opt-2-1", text: "React", votes: 25 },
        { id: "opt-2-2", text: "Angular", votes: 8 },
        { id: "opt-2-3", text: "Vue", votes: 12 },
        { id: "opt-2-4", text: "Svelte", votes: 7 },
      ],
      startDate: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: "single-choice",
      categories: ["Programming", "Web"],
      createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "poll-3",
      question: "Favorite season? (Multi-select)",
      options: [
        { id: "opt-3-1", text: "Spring", votes: 5 },
        { id: "opt-3-2", text: "Summer", votes: 10 },
        { id: "opt-3-3", text: "Autumn", votes: 8 },
        { id: "opt-3-4", text: "Winter", votes: 3 },
      ],
      startDate: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now + 8 * 24 * 60 * 60 * 1000).toISOString(),
      type: "multi-select",
      categories: ["Lifestyle"],
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "poll-4",
      question: "Best pet? (Closed)",
      options: [
        { id: "opt-4-1", text: "Dog", votes: 10 },
        { id: "opt-4-2", text: "Cat", votes: 7 },
        { id: "opt-4-3", text: "Fish", votes: 2 },
      ],
      startDate: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: "single-choice",
      categories: ["Lifestyle", "Pets"],
      createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  )

  // Seed a few comments
  const seedComment = (pollId: string, author: string, text: string, hoursAgo: number, likes = 0) => {
    db.comments.push({
      id: uuidv4(),
      pollId,
      userId: adminId,
      author,
      text,
      createdAt: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
      likes,
    })
  }
  seedComment("poll-1", "alice", "I think TypeScript scales better long-term.", 2, 3)
  seedComment("poll-1", "bob", "JS forever for flexibility!", 5, 1)
  seedComment("poll-2", "sam", "React all the way!", 7, 4)

  db.seeded = true
})()

// Auth helpers
export const SESSION_COOKIE = "sessionId"
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // Ensures cookies are sent over HTTPS in production previews/prod
  secure: process.env.NODE_ENV === "production",
}

export function hashPassword(password: string, salt: string) {
  return SHA256(password + salt).toString()
}

export function createUser(email: string, password: string, role: Role = "user") {
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) throw new Error("User already exists")
  const salt = uuidv4()
  const passwordHash = hashPassword(password, salt)
  const user: User = { id: uuidv4(), email, passwordHash, salt, role, createdAt: new Date().toISOString() }
  db.users.push(user)
  return user
}
export function findUserByEmail(email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}
export function findUserById(id: string) {
  return db.users.find((u) => u.id === id)
}

// Poll helpers
export function getPolls(): Poll[] {
  return db.polls
}
export function addPoll(poll: Poll) {
  db.polls.push(poll)
}
export function getPollById(pollId: string) {
  return db.polls.find((p) => p.id === pollId)
}

// Voting helpers with per-user selections
function getVoteMap(pollId: string): Map<string, string[]> {
  if (!db.votesByPoll.has(pollId)) db.votesByPoll.set(pollId, new Map<string, string[]>())
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return db.votesByPoll.get(pollId)!
}
export function hasUserVoted(pollId: string, userId: string) {
  return getVoteMap(pollId).has(userId)
}
export function getUserVoteOptions(pollId: string, userId: string): string[] | undefined {
  return getVoteMap(pollId).get(userId)
}
export function setUserVoteOptions(pollId: string, userId: string, optionIds: string[]) {
  getVoteMap(pollId).set(userId, optionIds)
}
export function clearUserVote(pollId: string, userId: string) {
  getVoteMap(pollId).delete(userId)
}
export function incrementVotes(poll: Poll, optionIds: string[]) {
  for (const id of optionIds) {
    const opt = poll.options.find((o) => o.id === id)
    if (opt) opt.votes += 1
  }
}
export function decrementVotes(poll: Poll, optionIds: string[]) {
  for (const id of optionIds) {
    const opt = poll.options.find((o) => o.id === id)
    if (opt) opt.votes = Math.max(0, opt.votes - 1)
  }
}
export function getParticipantCount(pollId: string): number {
  return getVoteMap(pollId).size
}

// Comments helpers
export function addComment(pollId: string, userId: string, author: string, text: string): Comment {
  const comment: Comment = {
    id: uuidv4(),
    pollId,
    userId,
    author,
    text,
    createdAt: new Date().toISOString(),
    likes: 0,
  }
  db.comments.push(comment)
  return comment
}
export function getCommentsForPoll(pollId: string) {
  return db.comments.filter((c) => c.pollId === pollId)
}
export function getCommentById(commentId: string) {
  return db.comments.find((c) => c.id === commentId)
}
export function getCommentsPaginated(
  pollId: string,
  sort: "newest" | "most-liked",
  offset: number,
  limit: number,
): { total: number; items: Comment[] } {
  const all = getCommentsForPoll(pollId)
  const sorted =
    sort === "most-liked"
      ? all.slice().sort((a, b) => b.likes - a.likes || +new Date(b.createdAt) - +new Date(a.createdAt))
      : all.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  const total = sorted.length
  const items = sorted.slice(offset, offset + limit)
  return { total, items }
}

// Comment like helpers (per-user like tracking)
function getLikeSet(commentId: string): Set<string> {
  if (!db.commentLikes.has(commentId)) db.commentLikes.set(commentId, new Set())
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return db.commentLikes.get(commentId)!
}
export function hasUserLikedComment(commentId: string, userId: string): boolean {
  return getLikeSet(commentId).has(userId)
}
export function likeComment(commentId: string, userId: string): number {
  const comment = getCommentById(commentId)
  if (!comment) throw new Error("Comment not found")
  const set = getLikeSet(commentId)
  if (!set.has(userId)) {
    set.add(userId)
    comment.likes = comment.likes + 1
  }
  return comment.likes
}
export function unlikeComment(commentId: string, userId: string): number {
  const comment = getCommentById(commentId)
  if (!comment) throw new Error("Comment not found")
  const set = getLikeSet(commentId)
  if (set.has(userId)) {
    set.delete(userId)
    comment.likes = Math.max(0, comment.likes - 1)
  }
  return comment.likes
}
