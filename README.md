# 🌸 TheDryDown — Your Perfume Directory

## What's Inside
- 664 perfumes from 132 brands
- Full search, filters, and sorting
- Fragrance note breakdowns with strength bars
- Affiliate "Where to Buy" links (FragranceNet, Amazon, Sephora, ScentSplit, Notino)
- Community reviews with write + vote
- "Submit a Perfume" form for community contributions
- Admin review panel to approve/reject submissions
- Brand directory and Notes explorer
- Mobile responsive

---

## 🚀 HOW TO PUT THIS WEBSITE LIVE (Step by Step)

### Step 1: Create a GitHub Account (free)
1. Go to https://github.com
2. Click "Sign Up"
3. Create your account (free)

### Step 2: Install Node.js on Your Computer
1. Go to https://nodejs.org
2. Download the "LTS" version (the big green button)
3. Install it (just click Next through the installer)
4. To verify: open Terminal (Mac) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like "v20.x.x"

### Step 3: Download This Project
1. Unzip the thedrydown-site.zip file somewhere on your computer
2. Open Terminal/Command Prompt
3. Navigate to the folder:
   ```
   cd path/to/thedrydown-site
   ```
   (Replace "path/to" with wherever you unzipped it)

### Step 4: Install Dependencies
In the terminal, run:
```
npm install
```
Wait for it to finish (might take 1-2 minutes).

### Step 5: Test It Locally
Run:
```
npm run dev
```
Then open your browser and go to: http://localhost:3000
You should see TheDryDown! 🎉

### Step 6: Deploy to Vercel (FREE hosting)
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Click "Add New" → "Project"
4. Connect your GitHub and push this code to a new repository:
   ```
   git init
   git add .
   git commit -m "TheDryDown launch"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/thedrydown.git
   git push -u origin main
   ```
5. Back in Vercel, select your "thedrydown" repository
6. Click "Deploy"
7. Wait 1-2 minutes... YOUR WEBSITE IS LIVE! 🚀

Vercel will give you a URL like: thedrydown.vercel.app
You can later connect your own domain (like thedrydown.com).

---

## 📁 Project Structure
```
thedrydown-site/
├── app/
│   ├── globals.css      ← Global styles + Tailwind
│   ├── layout.js        ← Root layout + SEO metadata
│   └── page.js          ← Main app (all features)
├── data/
│   └── perfumes.js      ← Full 664-perfume database
├── package.json         ← Dependencies
├── next.config.js       ← Next.js config
├── tailwind.config.js   ← Tailwind config
├── postcss.config.js    ← PostCSS config
└── README.md            ← This file
```

---

## 💰 Setting Up Affiliate Links
The buy links already have affiliate URL structures. To earn commissions:

1. **Amazon Associates** — Sign up at https://affiliate-program.amazon.com
   - Replace `thedrydown-20` in the code with your actual tag
2. **FragranceNet** — Apply at their affiliate page
3. **ScentSplit** — Email them about their referral program
4. **Sephora** — Join via Rakuten Advertising
5. **Notino** — Apply on their website

---

## 🔧 How to Add More Perfumes
1. Open `data/perfumes.js`
2. The data is in a compact array format
3. Or use the "Submit a Perfume" form on the website and approve via Admin panel
4. For bulk additions: edit the CSV file and re-run the Python converter

---

## 🌐 Custom Domain
After deploying to Vercel:
1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your domain (e.g., thedrydown.com)
4. Update your domain's DNS to point to Vercel

Buy a domain at: Namecheap.com (~$10/year) or Google Domains

---

Built with Next.js, Tailwind CSS, and lots of perfume knowledge 🌸
