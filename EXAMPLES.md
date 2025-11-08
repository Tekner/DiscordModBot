# Quick Start Examples

This guide provides practical examples for getting your Discord Moderation Bot up and running quickly.

## Example 1: Basic Setup for General Chat

After inviting the bot to your server:

```
1. Set up moderator alerts
   /config moderator-channel channel:#mod-alerts

2. Monitor your main chat channels
   /config channels add channel:#general
   /config channels add channel:#off-topic

3. Add basic moderation rules
   /rules add type:Spam Detection action:Delete
   /rules add type:Caps Lock Spam action:Warn

4. Enable auto-moderation
   /config auto-delete enabled:true
```

## Example 2: Advanced Content Filtering

For more sophisticated content moderation:

```
1. Block specific inappropriate terms
   /rules add type:Keyword pattern:spam action:Delete & Flag
   /rules add type:Keyword pattern:scam action:Delete & Flag

2. Use regex for pattern matching
   /rules add type:Regular Expression pattern:\b(buy|sell)\s+(discord|nitro)\b action:Delete
   
3. Set flag thresholds
   /config flag-threshold threshold:3
```

## Example 3: Gaming Community Setup

Optimized for gaming servers:

```
1. Monitor game-specific channels
   /config channels add channel:#lfg
   /config channels add channel:#game-chat
   /config channels add channel:#trade

2. Anti-spam rules
   /rules add type:Spam Detection action:Delete & Flag
   /rules add type:Regular Expression pattern:discord\.gg\/[a-zA-Z0-9]+ action:Flag
   
3. View flagged users
   /flags list
```

## Example 4: Reviewing Moderation Activity

Stay on top of what's happening:

```
# View recent moderation actions
/logs recent limit:25

# Check a specific user's history
/flags view user:@SuspiciousUser
/logs user user:@SuspiciousUser limit:10

# Review all active rules
/rules list

# Check current configuration
/config view
```

## Example 5: Managing Rules

Fine-tune your moderation:

```
# List all rules with IDs
/rules list

# Temporarily disable a rule
/rules toggle rule-id:3 enabled:false

# Re-enable it later
/rules toggle rule-id:3 enabled:true

# Remove a rule completely
/rules remove rule-id:5
```

## Example 6: Manual Moderation

When you need to take manual action:

```
# Flag a user manually
/flags add user:@BadActor reason:Harassment in DMs

# View their full record
/flags view user:@BadActor

# Clear flags if they improve
/flags remove user:@BadActor
```

## Common Rule Patterns

### Block Invite Links
```
/rules add type:Regular Expression pattern:discord\.gg\/\w+ action:Delete
```

### Prevent Excessive Mentions
```
/rules add type:Regular Expression pattern:(@everyone|@here) action:Delete & Flag
```

### Block Phone Numbers
```
/rules add type:Regular Expression pattern:\d{3}[-.]?\d{3}[-.]?\d{4} action:Delete
```

### Catch Common Scam Terms
```
/rules add type:Keyword pattern:free nitro action:Delete & Flag
/rules add type:Keyword pattern:click here action:Flag
```

### Block External Links (Except Trusted Domains)
```
/rules add type:Regular Expression pattern:https?:\/\/(?!twitter\.com|youtube\.com) action:Flag
```

## Testing Your Setup

1. **Test in a private channel first**
   - Add a test channel to monitoring
   - Try posting messages that should trigger rules
   - Verify actions are taken correctly
   - Check that logs are recorded

2. **Review moderator notifications**
   - Ensure alerts appear in your moderator channel
   - Verify formatting and information is clear
   - Test with different rule types

3. **Adjust thresholds**
   - Monitor false positives
   - Adjust flag thresholds if needed
   - Fine-tune regex patterns

## Troubleshooting Common Issues

### Bot isn't responding
```bash
# Check bot is running
npm start

# Verify commands are deployed
npm run deploy

# Check logs
cat logs/bot-*.log
```

### Too many false positives
```
# Disable problematic rule temporarily
/rules toggle rule-id:X enabled:false

# Review the rule pattern
/rules list

# Adjust or replace the rule
/rules remove rule-id:X
/rules add type:... pattern:... action:...
```

### Missing notifications
```
# Verify moderator channel is set
/config view

# Update if needed
/config moderator-channel channel:#mod-alerts
```

## Best Practices

1. **Start Conservative**: Begin with warn/flag actions, move to auto-delete once confident
2. **Monitor Regularly**: Check logs daily initially to catch false positives
3. **Document Rules**: Keep notes on why each rule exists
4. **Test Changes**: Use a test channel before applying to main channels
5. **Review Flags**: Check flagged users weekly to identify patterns
6. **Adjust Thresholds**: Fine-tune based on your server's activity level

## Getting Help

View all available commands:
```
/help
```

Need more information? Check the main README.md for detailed documentation.
