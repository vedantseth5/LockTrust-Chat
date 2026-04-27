
## Auth

### POST /auth/signup
Creates account and sends OTP to backend terminal.
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"+1","phoneNumber":"5551234567","displayName":"Alice Smith","email":"alice@example.com"}'
```
```json
{ "message": "OTP sent. Check the backend logs (dev mode)." }
```

---

### POST /auth/login
Sends OTP for an existing verified account.
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"+1","phoneNumber":"5551234567"}'
```
```json
{ "message": "OTP sent. Check the backend logs (dev mode)." }
```

---

### POST /auth/verify-otp
Verifies OTP and returns JWT. `purpose` is `SIGNUP` or `LOGIN`.
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","otp":"123456","purpose":"LOGIN"}'
```
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "phone": "+15551234567",
    "email": "alice@example.com",
    "displayName": "Alice Smith",
    "role": "MEMBER",
    "avatarColor": "#42A5F5",
    "title": null,
    "timezone": "UTC",
    "presence": "OFFLINE",
    "customStatusMessage": null,
    "createdAt": "2025-04-27T10:00:00"
  },
  "message": "Authentication successful."
}
```

---

### Admin login
Admin phone is `+10000000000`, OTP is `123456`.
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"+1","phoneNumber":"0000000000"}'

curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+10000000000","otp":"123456","purpose":"LOGIN"}'
```

---

## Users

### GET /users/me
```bash
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer {{token}}"
```
```json
{
  "id": 1, "phone": "+15551234567", "email": "alice@example.com",
  "displayName": "Alice Smith", "role": "MEMBER", "avatarColor": "#42A5F5",
  "title": null, "timezone": "UTC", "presence": "ONLINE",
  "customStatusMessage": null, "createdAt": "2025-04-27T10:00:00"
}
```

---

### GET /users
Returns all verified users.
```bash
curl http://localhost:8080/api/users \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  { "id": 1, "phone": "+15551234567", "displayName": "Alice Smith", "role": "MEMBER", "presence": "ONLINE", "..." : "..." },
  { "id": 2, "phone": "+15559876543", "displayName": "Bob Jones",  "role": "MEMBER", "presence": "OFFLINE", "...": "..." }
]
```

---

### GET /users/{id}
```bash
curl http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer {{token}}"
```
```json
{ "id": 1, "phone": "+15551234567", "displayName": "Alice Smith", "..." : "..." }
```

---

### GET /users/search?q=Alice
Do **not** wrap the value in quotes. `?q=Alice` not `?q="Alice"`.
```bash
curl "http://localhost:8080/api/users/search?q=Alice" \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  { "id": 1, "phone": "+15551234567", "displayName": "Alice Smith", "presence": "ONLINE", "...": "..." }
]
```

---

### PUT /users/me/profile
All fields optional.
```bash
curl -X PUT http://localhost:8080/api/users/me/profile \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice S.","email":"alice@company.com","title":"Engineer","timezone":"America/New_York","avatarColor":"#7E57C2"}'
```
```json
{ "id": 1, "phone": "+15551234567", "displayName": "Alice S.", "title": "Engineer", "...": "..." }
```

---

### PUT /users/me/status
`presence` values: `ONLINE` `AWAY` `DND` `OFFLINE`
```bash
curl -X PUT http://localhost:8080/api/users/me/status \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"presence":"AWAY","customMessage":"In a meeting"}'
```
```json
{ "id": 1, "presence": "AWAY", "customStatusMessage": "In a meeting", "...": "..." }
```

---

## Channels

### GET /channels
```bash
curl http://localhost:8080/api/channels \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  { "id": 1, "name": "general", "description": "General discussion", "isPrivate": false, "memberCount": 5, "memberIds": [1,2,3,4,5], "createdAt": "2025-04-27T10:00:00" }
]
```

---

### POST /channels
```bash
curl -X POST http://localhost:8080/api/channels \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"name":"design","description":"Design team","isPrivate":false}'
```
```json
{ "id": 3, "name": "design", "description": "Design team", "isPrivate": false, "memberCount": 1, "memberIds": [1], "createdAt": "2025-04-27T11:00:00" }
```

---

### POST /channels/{id}/join
```bash
curl -X POST http://localhost:8080/api/channels/3/join \
  -H "Authorization: Bearer {{token}}"
```
```json
{ "id": 3, "name": "design", "memberCount": 2, "memberIds": [1,2], "..." : "..." }
```

---

### DELETE /channels/{id}/leave
```bash
curl -X DELETE http://localhost:8080/api/channels/3/leave \
  -H "Authorization: Bearer {{token}}"
```
`200 OK` (empty body)

---

### GET /channels/{id}/members
```bash
curl http://localhost:8080/api/channels/1/members \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  { "id": 1, "phone": "+15551234567", "displayName": "Alice Smith", "...": "..." }
]
```

---

### POST /channels/{id}/members
Invite another user by their ID.
```bash
curl -X POST http://localhost:8080/api/channels/1/members \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"userId":2}'
```
```json
{ "id": 1, "name": "general", "memberCount": 6, "memberIds": [1,2,3,4,5,6], "...": "..." }
```

---

## Messages

### GET /channels/{channelId}/messages
```bash
curl "http://localhost:8080/api/channels/1/messages?page=0&size=50" \
  -H "Authorization: Bearer {{token}}"
```
```json
{
  "content": [
    {
      "id": 10, "channelId": 1, "senderId": 1, "senderName": "Alice Smith",
      "senderAvatarColor": "#42A5F5", "content": "Hello team!",
      "edited": false, "deleted": false, "replyCount": 2,
      "reactions": [], "createdAt": "2025-04-27T10:05:00"
    }
  ],
  "totalElements": 1, "totalPages": 1, "number": 0
}
```

---

### POST /channels/{channelId}/messages
```bash
curl -X POST http://localhost:8080/api/channels/1/messages \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello team!"}'
```
```json
{ "id": 10, "channelId": 1, "senderId": 1, "senderName": "Alice Smith", "content": "Hello team!", "edited": false, "reactions": [], "createdAt": "2025-04-27T10:05:00" }
```

---

### PUT /channels/{channelId}/messages/{messageId}
```bash
curl -X PUT http://localhost:8080/api/channels/1/messages/10 \
  -H "Axuthorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello everyone!"}'
```
```json
{ "id": 10, "content": "Hello everyone!", "edited": true, "...": "..." }
```

---

### DELETE /channels/{channelId}/messages/{messageId}
```bash
curl -X DELETE http://localhost:8080/api/channels/1/messages/10 \
  -H "Authorization: Bearer {{token}}"
```
`200 OK` (empty body)

---

### GET /channels/{channelId}/messages/{messageId}/replies
```bash
curl http://localhost:8080/api/channels/1/messages/10/replies \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  { "id": 5, "parentMessageId": 10, "senderId": 2, "senderName": "Bob Jones", "content": "Hi Alice!", "edited": false, "reactions": [], "createdAt": "2025-04-27T10:06:00" }
]
```

---

### POST /channels/{channelId}/messages/{messageId}/replies
```bash
curl -X POST http://localhost:8080/api/channels/1/messages/10/replies \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hi Alice!"}'
```
```json
{ "id": 5, "parentMessageId": 10, "senderId": 2, "senderName": "Bob Jones", "content": "Hi Alice!", "reactions": [], "createdAt": "2025-04-27T10:06:00" }
```

---

## Reactions

Toggle adds if not present, removes if already there.

### POST /messages/{messageId}/reactions
```bash
curl -X POST http://localhost:8080/api/messages/10/reactions \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}'
```
`200 OK` (empty body)

---

### POST /replies/{replyId}/reactions
```bash
curl -X POST http://localhost:8080/api/replies/5/reactions \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"❤️"}'
```
`200 OK` (empty body)

---

### POST /dm/messages/{dmMessageId}/reactions
```bash
curl -X POST http://localhost:8080/api/dm/messages/7/reactions \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"😂"}'
```
```json
{ "id": 7, "content": "Hey!", "reactions": [{ "emoji": "😂", "count": 1, "userIds": [1] }], "...": "..." }
```

---

## Direct Messages

### GET /dm/conversations
```bash
curl http://localhost:8080/api/dm/conversations \
  -H "Authorization: Bearer {{token}}"
```
```json
[
  {
    "id": 1, "isGroup": false, "name": null, "createdAt": "2025-04-27T10:00:00",
    "participants": [
      { "id": 1, "displayName": "Alice Smith", "phone": "+15551234567", "...": "..." },
      { "id": 2, "displayName": "Bob Jones",   "phone": "+15559876543", "...": "..." }
    ]
  }
]
```

---

### POST /dm/conversations
If a conversation with the same participants already exists, returns the existing one.
```bash
curl -X POST http://localhost:8080/api/dm/conversations \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"participantIds":[2]}'
```
```json
{ "id": 1, "isGroup": false, "participants": [ { "id": 1, "...": "..." }, { "id": 2, "...": "..." } ], "createdAt": "2025-04-27T10:00:00" }
```

---

### GET /dm/conversations/{id}/messages
```bash
curl "http://localhost:8080/api/dm/conversations/1/messages?page=0&size=50" \
  -H "Authorization: Bearer {{token}}"
```
```json
{
  "content": [
    { "id": 7, "conversationId": 1, "senderId": 1, "senderName": "Alice Smith", "content": "Hey!", "edited": false, "deleted": false, "reactions": [], "createdAt": "2025-04-27T10:10:00" }
  ],
  "totalElements": 1, "totalPages": 1, "number": 0
}
```

---

### POST /dm/conversations/{id}/messages
```bash
curl -X POST http://localhost:8080/api/dm/conversations/1/messages \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hey!"}'
```
```json
{ "id": 7, "conversationId": 1, "senderId": 1, "senderName": "Alice Smith", "content": "Hey!", "reactions": [], "createdAt": "2025-04-27T10:10:00" }
```

---

### PUT /dm/conversations/{convId}/messages/{msgId}
```bash
curl -X PUT http://localhost:8080/api/dm/conversations/1/messages/7 \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hey there!"}'
```
```json
{ "id": 7, "content": "Hey there!", "edited": true, "...": "..." }
```

---

### DELETE /dm/conversations/{convId}/messages/{msgId}
```bash
curl -X DELETE http://localhost:8080/api/dm/conversations/1/messages/7 \
  -H "Authorization: Bearer {{token}}"
```
`200 OK` (empty body)

---

## Search

### GET /search?q=hello
Searches channel messages and channels visible to the user.
```bash
curl "http://localhost:8080/api/search?q=hello" \
  -H "Authorization: Bearer {{token}}"
```
```json
{
  "messages": [
    { "id": 10, "channelId": 1, "senderName": "Alice Smith", "content": "Hello team!", "...": "..." }
  ],
  "channels": [
    { "id": 1, "name": "general", "...": "..." }
  ],
  "users": []
}
```

---

## Admin

All admin requests use `{{adminToken}}`.

### GET /admin/users
```bash
curl http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
[
  { "id": 1, "phone": "+15551234567", "displayName": "Alice Smith", "role": "MEMBER", "...": "..." },
  { "id": 99, "phone": "+10000000000", "displayName": "Admin", "role": "ADMIN", "...": "..." }
]
```

---

### PUT /admin/users/{id}/role
`role` must be `ADMIN` or `MEMBER`.
```bash
curl -X PUT http://localhost:8080/api/admin/users/1/role \
  -H "Authorization: Bearer {{adminToken}}" \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}'
```
```json
{ "id": 1, "displayName": "Alice Smith", "role": "ADMIN", "...": "..." }
```

---

### GET /admin/channels
```bash
curl http://localhost:8080/api/admin/channels \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
[
  { "id": 1, "name": "general", "isPrivate": false, "memberCount": 5, "...": "..." }
]
```

---

### GET /admin/channels/{id}/messages
```bash
curl "http://localhost:8080/api/admin/channels/1/messages?page=0&size=50" \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
[
  { "id": 10, "senderName": "Alice Smith", "content": "Hello team!", "...": "..." }
]
```

---

### GET /admin/dm/conversations
```bash
curl http://localhost:8080/api/admin/dm/conversations \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
[
  { "id": 1, "isGroup": false, "participants": [ { "...": "..." } ], "...": "..." }
]
```

---

### GET /admin/dm/conversations/{id}/messages
```bash
curl "http://localhost:8080/api/admin/dm/conversations/1/messages?page=0&size=50" \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
[
  { "id": 7, "senderName": "Alice Smith", "content": "Hey!", "...": "..." }
]
```

---

### GET /admin/search?q=hello
Searches all messages, DMs, and users workspace-wide.
```bash
curl "http://localhost:8080/api/admin/search?q=hello" \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
{
  "messages": [ { "id": 10, "content": "Hello team!", "...": "..." } ],
  "dms":      [ { "id": 7,  "content": "Hey!",        "...": "..." } ],
  "users":    [ { "id": 1,  "displayName": "Alice Smith", "...": "..." } ]
}
```

---

### GET /admin/users/{id}/activity
```bash
curl http://localhost:8080/api/admin/users/1/activity \
  -H "Authorization: Bearer {{adminToken}}"
```
```json
{
  "user":     { "id": 1, "displayName": "Alice Smith", "...": "..." },
  "messages": [ { "id": 10, "content": "Hello team!", "...": "..." } ],
  "dms":      [ { "id": 7,  "content": "Hey!",        "...": "..." } ],
  "channels": [ { "id": 1,  "name": "general",        "...": "..." } ]
}
```
