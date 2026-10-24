# IAM Security Patch — Refresh Token Hashing

**IdentityPlatform — Critical Security Fix**

---

## Problem

IAM `iam_sessions` table stores `refresh_token` as **PLAINTEXT**. This is a **critical security vulnerability**. If the database is compromised, all active sessions can be hijacked.

---

## Solution

**Approach:** Hash refresh tokens using SHA-256.

**Changes:**
1. Add `refresh_token_hash` column to `iam_sessions` table
2. Hash all existing refresh tokens (invalidates all active sessions)
3. Update `DrizzleSessionRepository` to use hash for lookups
4. Update schema to include hash column

---

## Files Changed

### 1. Migration: `0014_hash_refresh_tokens.sql`

**Location:** `modules/iam/src/infrastructure/database/migrations/0014_hash_refresh_tokens.sql`

**Changes:**
- Add `refresh_token_hash` column
- Hash all existing tokens
- Create index on hash

**Note:** This migration will **invalidate all active sessions**. Users must re-authenticate. This is intentional for security reasons.

### 2. Repository: `DrizzleSessionRepository.ts`

**Location:** `modules/iam/src/infrastructure/repositories/DrizzleSessionRepository.ts`

**Changes:**
- Add `hashToken()` helper method (SHA-256)
- Update `save()` to hash token before saving
- Update `findByRefreshToken()` to use hash for lookup
- Update `rotate()` to hash tokens

### 3. Schema: `sessions.table.ts`

**Location:** `modules/iam/src/infrastructure/database/schema/sessions.table.ts`

**Changes:**
- Add `refreshTokenHash` column to schema

---

## Implementation Details

### Hashing Algorithm

```typescript
private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

**Why SHA-256:**
- Fast (performance)
- Secure (no known collisions)
- Standard (widely used)

### Backward Compatibility

**During migration:**
- Old plaintext token → hash calculated
- New tokens → hashed before save
- Lookup uses hash
- Plaintext column kept temporarily (for rollback)

**Future cleanup:**
- After migration complete, drop `refresh_token` column
- Keep only `refresh_token_hash`

---

## Testing

### Test Steps

1. **Run migration** on staging database
2. **Verify** all tokens are hashed
3. **Test** login flow (should work)
4. **Test** session refresh (should work)
5. **Verify** old sessions are invalidated
6. **Test** logout/login again (should work)

### Expected Behavior

- **Old sessions:** Invalidated (users must re-authenticate)
- **New sessions:** Hashed, work normally
- **Performance:** Minimal impact (SHA-256 is fast)

---

## Deployment Strategy

### 1. Staging (First)

- Deploy migration to staging
- Test thoroughly
- Verify no errors

### 2. Production (Maintenance Window)

- Schedule maintenance window (low-traffic time)
- Notify users in advance (email, in-app notification)
- Deploy migration
- Monitor for errors
- Support tickets expected (users re-authenticating)

### 3. Rollback Plan

**If issues occur:**
- Revert code changes
- Rollback migration (drop `refresh_token_hash` column)
- Restore database from backup

---

## Communication

### User Notification

**Template:**
```
Subject: Important Security Update - Please Re-Authenticate

Dear User,

We are implementing a critical security update to protect your account. 
As part of this update, all active sessions will be invalidated.

What this means:
- You will need to log in again
- All devices will require re-authentication
- This is a one-time action

When: [Date/Time]

We apologize for the inconvenience and appreciate your understanding.

Thank you,
IdentityPlatform Team
```

---

## Security Impact

### Before Fix
- **Risk:** Database compromise → session hijacking
- **Vulnerability:** Critical
- **Impact:** All active sessions

### After Fix
- **Risk:** Database compromise → no session hijacking (tokens hashed)
- **Vulnerability:** Mitigated
- **Impact:** None (tokens protected)

---

## Next Steps

1. **Test** migration on staging
2. **Schedule** production maintenance window
3. **Notify** users
4. **Deploy** migration
5. **Monitor** for errors
6. **Verify** all tokens hashed
7. **Plan** future cleanup (drop plaintext column)

---

## Summary

**Status:** ✅ Ready for deployment

**Files Changed:**
- `0014_hash_refresh_tokens.sql` (NEW)
- `DrizzleSessionRepository.ts` (MODIFIED)
- `sessions.table.ts` (MODIFIED)

**Impact:**
- Security: Critical vulnerability fixed
- User Experience: All sessions invalidated (one-time)
- Performance: Minimal impact

**Recommendation:** Deploy to staging first, then production during maintenance window.

---

**END OF IAM SECURITY PATCH**
