# Deployment Checklist

Use this checklist to ensure everything is set up correctly before going live.

## ✅ Pre-Deployment Checklist

### Supabase Setup
- [ ] Created Supabase project
- [ ] Ran complete SQL schema (supabase-schema.sql)
- [ ] Verified all 4 tables exist: family_members, budget_items, chores, appointments
- [ ] Added family members to family_members table
- [ ] Tested creating a record in each table
- [ ] Copied Project URL and anon key

### Local Development
- [ ] Ran `npm install` successfully
- [ ] Created .env.local with Supabase credentials
- [ ] Verified app runs on http://localhost:3000
- [ ] Tested Budget section (add, complete, delete)
- [ ] Tested Chores section (add, complete, delete)
- [ ] Tested Appointments section (add, reminder, delete)
- [ ] Checked browser console for errors
- [ ] Verified data saves to Supabase

### Code Quality
- [ ] Removed any console.log statements
- [ ] Checked for TypeScript errors (`npm run build`)
- [ ] No sensitive data in code (API keys in env only)
- [ ] .gitignore includes .env files
- [ ] README.md is updated with your info

### Git Setup
- [ ] Initialized git repo (`git init`)
- [ ] Created .gitignore
- [ ] Made initial commit
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub

### Vercel Deployment
- [ ] Connected GitHub repo to Vercel
- [ ] Added environment variables in Vercel dashboard
- [ ] Triggered first deployment
- [ ] Deployment succeeded (green checkmark)
- [ ] Visited live URL and tested
- [ ] Verified Supabase connection works on production

### Post-Deployment Testing
- [ ] Add a budget item on production
- [ ] Add a chore on production
- [ ] Add an appointment on production
- [ ] Mark items as complete/paid
- [ ] Delete a test item
- [ ] Check mobile view (responsive design)
- [ ] Test in different browsers

### Security Check
- [ ] Environment variables are set in Vercel (not in code)
- [ ] .env.local is in .gitignore
- [ ] No API keys visible in GitHub repo
- [ ] Supabase RLS policies are enabled
- [ ] Project is set to private on GitHub (optional)

## 🚀 Going Live Checklist

### Before Sharing with Family
- [ ] Added all family members to database
- [ ] Set up initial budget items
- [ ] Created first set of chores
- [ ] Added upcoming appointments
- [ ] Tested reminder system
- [ ] Bookmarked the Vercel URL
- [ ] Took screenshots for reference

### Share with Family
- [ ] Shared the Vercel URL
- [ ] Created quick tutorial for family
- [ ] Explained each section
- [ ] Set expectations for updates
- [ ] Got feedback on features

### Ongoing Maintenance
- [ ] Set calendar reminder to review budget monthly
- [ ] Set reminder to update chores weekly
- [ ] Plan to add new features based on usage
- [ ] Monitor Supabase usage (check dashboard monthly)

## 📊 Performance Monitoring

### Check Regularly
- [ ] Vercel analytics (if enabled)
- [ ] Supabase database size
- [ ] Number of API requests
- [ ] Load time on mobile

### Supabase Free Tier Limits
- Database size: 500 MB (plenty for family use)
- API requests: Unlimited
- Bandwidth: 5 GB/month
- File storage: 1 GB

**Note**: Unless you have 50+ family members entering 100+ items per day, you'll never hit these limits!

## 🔧 Troubleshooting

### If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Make sure supabase-schema.sql was run completely
4. Test locally first

### If data isn't showing:
1. Open browser console (F12)
2. Check Network tab for errors
3. Verify Supabase URL and key are correct
4. Check Supabase Table Editor - is data there?

### If mobile view looks wrong:
1. This shouldn't happen (Tailwind is responsive)
2. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache

## 🎉 Success Criteria

You're fully deployed when:
- ✅ App loads on Vercel URL
- ✅ Can add items in all three sections
- ✅ Data persists after page refresh
- ✅ Works on your phone
- ✅ Family can access and use it

## 📝 Custom Domain (Optional)

If you want a custom domain like familyhub.com:

1. Buy domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard, go to Settings → Domains
3. Add your custom domain
4. Update DNS records (Vercel provides instructions)
5. Wait 24-48 hours for DNS propagation

## 🔄 Updates

To update the app after making changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Vercel automatically deploys!
```

## 📞 Getting Help

- **Next.js Issues**: https://nextjs.org/docs
- **Supabase Issues**: https://supabase.com/docs
- **Vercel Issues**: https://vercel.com/docs
- **Tailwind Issues**: https://tailwindcss.com/docs

---

**Time Estimate**: 15-20 minutes total for complete deployment
**Skill Level Required**: Beginner-friendly with the guides provided
**Cost**: $0 (all free tiers)

Happy deploying! 🚀
