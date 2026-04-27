# LockTrust Chat — Postman Collection

## Setup

1. Import both files into Postman: `LockTrust-Chat.postman_collection.json` and `LockTrust-Environment.postman_environment.json`
2. Select the **LockTrust Chat** environment from the top-right dropdown
3. Make sure the backend is running on `http://localhost:8080`

---

## Authentication Flow

All protected endpoints require a Bearer token. The collection uses `{{token}}` automatically — you just need to populate it once by completing the login flow below.

### To log in as a regular user:
1. **Signup** — provide `countryCode` (e.g. `+1`), `phoneNumber`, `displayName`, and optionally `email`
2. **Login** — provide `countryCode` and `phoneNumber` to request an OTP
3. **Verify OTP** — provide the `phone` (full number e.g. `+15551234567`), `otp` (`123456` in dev), and `purpose` (`SIGNUP` or `LOGIN`). On success, `{{token}}` is **automatically saved** to the environment.

### To log in as admin:
- Admin phone is `+10000000000`, OTP is `123456`
- After Verify OTP, **manually copy** the `accessToken` from the response and paste it into the `adminToken` environment variable
- Admin endpoints use `{{adminToken}}` separately so you can test both roles at the same time

---

## Environment Variables

| Variable | Description |
|---|---|
| `baseUrl` | Backend base URL — `http://localhost:8080/api` |
| `token` | JWT for the logged-in regular user — auto-set by Verify OTP |
| `adminToken` | JWT for the admin user — set manually |
| `channelId` | ID of a channel — copy from any channel response |
| `messageId` | ID of a channel message — copy from any message response |
| `replyId` | ID of a thread reply — copy from any reply response |
| `dmConversationId` | ID of a DM conversation — copy from any DM conversation response |
| `dmMessageId` | ID of a DM message — copy from any DM message response |
| `userId` | ID of a user — copy from any user response |

---

## API Reference

### Auth

| Request | Method | What it does |
|---|---|---|
| Signup | POST `/auth/signup` | Creates a new unverified account with phone + display name. Email is optional. Sends OTP (check backend terminal). |
| Login | POST `/auth/login` | Sends an OTP to the given phone number for an existing verified account. |
| Verify OTP | POST `/auth/verify-otp` | Confirms the OTP. On success returns a JWT token and user object. Set `purpose` to `SIGNUP` for first-time verification or `LOGIN` for subsequent logins. |

---

### Users

| Request | Method | What it does |
|---|---|---|
| Get Me | GET `/users/me` | Returns the currently authenticated user's profile. |
| Get All Users | GET `/users` | Returns all verified users in the workspace. |
| Get User by ID | GET `/users/{{userId}}` | Returns a single user's profile by their ID. |
| Search Users | GET `/users/search?q=` | Searches users by display name, phone number, or email. |
| Update Profile | PUT `/users/me/profile` | Updates the authenticated user's display name, email, job title, timezone, or avatar color. Phone cannot be changed. |
| Update Status | PUT `/users/me/status` | Sets the user's presence (`ONLINE`, `AWAY`, `DND`, `OFFLINE`) and optional custom status message. |

---

### Channels

| Request | Method | What it does |
|---|---|---|
| Get Channels | GET `/channels` | Returns all channels visible to the authenticated user (public channels + private channels they are a member of). |
| Create Channel | POST `/channels` | Creates a new channel. Set `isPrivate: true` for a private channel. |
| Get Channel by ID | GET `/channels/{{channelId}}` | Returns details of a specific channel. |
| Join Channel | POST `/channels/{{channelId}}/join` | Adds the authenticated user to a public channel. |
| Leave Channel | DELETE `/channels/{{channelId}}/leave` | Removes the authenticated user from a channel. |
| Get Channel Members | GET `/channels/{{channelId}}/members` | Returns the list of members in a channel. |
| Add Member to Channel | POST `/channels/{{channelId}}/members` | Adds another user (by `userId`) to a channel. Used for inviting people to private channels. |

---

### Messages

| Request | Method | What it does |
|---|---|---|
| Get Channel Messages | GET `/channels/{{channelId}}/messages` | Returns paginated messages for a channel. Use `page` and `size` query params. |
| Send Message | POST `/channels/{{channelId}}/messages` | Sends a message to a channel. |
| Edit Message | PUT `/channels/{{channelId}}/messages/{{messageId}}` | Edits the content of an existing message. Only the sender can edit. |
| Delete Message | DELETE `/channels/{{channelId}}/messages/{{messageId}}` | Soft-deletes a message. Only the sender can delete. |
| Get Thread Replies | GET `/channels/{{channelId}}/messages/{{messageId}}/replies` | Returns all replies in a message thread. |
| Add Thread Reply | POST `/channels/{{channelId}}/messages/{{messageId}}/replies` | Posts a reply in a message thread. |

---

### Reactions

| Request | Method | What it does |
|---|---|---|
| Toggle Message Reaction | POST `/messages/{{messageId}}/reactions` | Adds or removes an emoji reaction on a channel message. Send `emoji` in the body (e.g. `"👍"`). Calling it again with the same emoji removes the reaction. |
| Toggle Thread Reply Reaction | POST `/replies/{{replyId}}/reactions` | Adds or removes an emoji reaction on a thread reply. |
| Toggle DM Reaction | POST `/dm/messages/{{dmMessageId}}/reactions` | Adds or removes an emoji reaction on a direct message. |

---

### Direct Messages

| Request | Method | What it does |
|---|---|---|
| Get Conversations | GET `/dm/conversations` | Returns all DM conversations the authenticated user is part of. |
| Create or Get Conversation | POST `/dm/conversations` | Creates a new DM conversation with the given `participantIds` array. If a conversation with those exact participants already exists, returns the existing one. |
| Get DM Messages | GET `/dm/conversations/{{dmConversationId}}/messages` | Returns paginated messages for a DM conversation. |
| Send DM | POST `/dm/conversations/{{dmConversationId}}/messages` | Sends a message in a DM conversation. |
| Edit DM | PUT `/dm/conversations/{{dmConversationId}}/messages/{{dmMessageId}}` | Edits a DM message. Only the sender can edit. |
| Delete DM | DELETE `/dm/conversations/{{dmConversationId}}/messages/{{dmMessageId}}` | Soft-deletes a DM message. Only the sender can delete. |

---

### Search

| Request | Method | What it does |
|---|---|---|
| Search | GET `/search?q=` | Searches across channel messages and channels visible to the authenticated user. Returns grouped results. |

---

### Admin

All admin endpoints require `{{adminToken}}`. The admin account is identified by phone `+10000000000`.

| Request | Method | What it does |
|---|---|---|
| List Users | GET `/admin/users` | Returns all users including unverified accounts. |
| Update User Role | PUT `/admin/users/{{userId}}/role` | Changes a user's role. Valid values: `ADMIN` or `MEMBER`. |
| List Channels | GET `/admin/channels` | Returns all channels in the workspace. |
| Get Channel Messages (Admin) | GET `/admin/channels/{{channelId}}/messages` | Returns paginated messages for any channel regardless of membership. |
| List DM Conversations (Admin) | GET `/admin/dm/conversations` | Returns all DM conversations in the workspace. |
| Get DM Messages (Admin) | GET `/admin/dm/conversations/{{dmConversationId}}/messages` | Returns paginated messages for any DM conversation. |
| Admin Search | GET `/admin/search?q=` | Searches across all channel messages, DMs, and users workspace-wide. |
| Get User Activity (Admin) | GET `/admin/users/{{userId}}/activity` | Returns a summary of a user's messages, DMs, and channel memberships. |
