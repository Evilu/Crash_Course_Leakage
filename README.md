# 🧠 Node.js Memory Leak Crash Course

> A simple bootstrap project for detecting and fixing memory leaks in Node.js applications

This is a hands-on lab for anyone who ever wanted to inspect memory leaks in their Node.js app heap — but was always too afraid to ask 😅

You'll see that understanding heap snapshots is actually **way easier** than it looks.  
By the end of this mini-lab, you'll be able to **spot a real memory leak** and fix it confidently.

---

## Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Chrome browser** - For DevTools debugging
- **npm or yarn** - Comes with Node.js
- **Basic JavaScript/TypeScript knowledge** - You can read simple code

---

## Project Structure

```
├── leaky.ts    # 💣 Intentionally leaky version
├── fixed.ts    # ✅ The fixed version (no peeking!)
├── package.json
└── README.md
```

- **`leaky.ts`** → intentionally leaky version of a simple Express app
- **`fixed.ts`** → the fix (you'll try to solve it yourself first!)

---

##  Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Leaky App
```bash
npm run leaky
```

The app uses **vite-node** to bundle and run the TypeScript source with an open **inspect channel**.

You should see:
```
 Debugger listening on port 8080
 Server running on http://localhost:3000
```

**What's running:**
* **App server:** [http://localhost:3000](http://localhost:3000)
* **Inspector port:** `8080` (for Chrome DevTools)

---

## 🔧 Connecting Chrome DevTools

### Step 1: Open Chrome Inspector
1. Open Chrome and navigate to:  
   👉 `chrome://inspect/#devices`

### Step 2: Configure the Port
2. Click **Configure...** button
3. Add `localhost:8080` to the list
4. Click **Done**

### Step 3: Connect to Your App
5. Look for **Remote Target** section
6. You should see "leaky.ts" or similar
7. Click **inspect** link below it
8. Chrome DevTools opens connected to your Node.js backend! 

**Troubleshooting:** Don't see your target? Make sure the app is running (`npm run leaky`)

---

## 📸 Taking Your First Heap Snapshot

1. In DevTools, click the **Memory** tab
2. Select **Heap snapshot** radio button
3. Click the **Take snapshot** button (circle icon)
4. Wait a few seconds for it to process

**Pro tip:** Name your snapshots! Click on "Snapshot 1" and rename it to "baseline" or "after 10 requests"

---

## 💡 Understanding What You See

### Key Metrics Explained

* **Shallow Size** → Memory used by the object itself (just its own properties)
* **Retained Size** → Total memory that would be freed if this object was deleted (includes everything it references)
* **Distance** → How many references away from the root (lower = harder to GC)
* **GC (Garbage Collection)** → Node's automatic heap cleanup process

💭 **Think of it like this:**
- If an object is a **folder**, Shallow Size is the folder itself, Retained Size includes all files and subfolders inside it
- If the folder is deleted, the Retained Size is everything that gets deleted with it

### The Four Views

1. **Summary** → Groups objects by constructor name
2. **Comparison** → Shows diff between snapshots (great for finding leaks!)
3. **Containment** → Shows the complete object hierarchy
4. **Statistics** → Pie chart of memory distribution

---

##  Triggering the Memory Leak

### 1. Take a Baseline Snapshot
Before we cause any leaks, take your first snapshot and name it "Baseline"

### 2. Trigger the Leak Endpoint
Use curl, Postman, or any HTTP client:

```bash
# Run this 10 times
for i in {1..10}; do
  curl -s http://localhost:3000/leak
  echo "Request $i completed"
done
```

Or manually:
```bash
curl http://localhost:3000/leak
```
**Or simply use Postman:**
- Open Postman
- Send a GET request to `http://localhost:3000/leak`
- Hit Send 5-10 times

**Or even your browser:**
- Navigate to `http://localhost:3000/leak`
- Refresh the page 5-10 times (F5)


### 3. Take Another Snapshot
Name this one "After 10 requests"

### 4. Compare Snapshots
Switch to **Comparison** view and select your baseline snapshot to compare against

 **Red flags to look for:**
- Objects that keep growing in count
- Retained size increasing significantly
- Arrays or Maps that never shrink

---

## 🕵️‍♂️ Finding the Culprit

### Investigation Steps

1. **Switch to Comparison View**
    - Select your baseline snapshot from the dropdown
    - Sort by **Size Delta** (click the column header)

2. **Look for Suspicious Growth**
    - Focus on the biggest positive deltas
    - Common culprits: `(array)`, `(closure)`, `(string)`, custom class names

3. **Drill Down the Tree**
    - Click the arrow to expand entries
    - Follow the path: `system` → `Context` → `(closure)`
    - Look for YOUR code (you'll recognize function names)

4. **Inspect the Retainers**
    - Click on a specific object
    - Look at the **Retainers** panel below
    - This shows you WHY it's not being garbage collected

### What You're Looking For

```
📍 Common Memory Leak Patterns:
├── Global variables that keep growing
├── Event listeners that are never removed  
├── Closures capturing large objects
├── Timers/Intervals not cleared
└── Cache without size limits
```

---

## 🎯 What Success Looks Like

After fixing the leak, you should observe:

✅ **Healthy Memory Pattern:**
- Memory usage stabilizes after requests
- Retained size plateaus instead of growing
- Object count remains consistent
- GC successfully frees memory

❌ **Leak Symptoms:**
- Memory continuously increasing
- Retained size growing linearly with requests
- Object count keeps climbing
- Eventually: "JavaScript heap out of memory" error

---

## 💪 The Challenge

Think you found the problem? Try fixing it yourself before looking at `fixed.ts`!

### Test Your Fix

1. Stop the leaky app (Ctrl+C)
2. Make your changes to `leaky.ts`
3. Run it again: `npm run leaky`
4. Repeat the leak test
5. Take snapshots and compare

### Verify with the Solution

```bash
npm run fixed
```

Repeat the entire process with the fixed version. You should see:
- Stable memory after multiple requests
- Garbage collection working properly
- No accumulating objects

---

## 🆘 Common Issues & Solutions

### Can't See Remote Target?
```bash
# Check if port is in use
lsof -i :8080  # Mac/Linux
netstat -an | grep 8080  # Windows

# Kill the process if needed
kill -9 <PID>
```

### DevTools Won't Connect?
- ✓ Ensure app is running (`npm run leaky`)
- ✓ Try restarting Chrome
- ✓ Check firewall settings for port 8080
- ✓ Try incognito mode (extensions might interfere)

### Snapshots Taking Forever?
- Normal for first snapshot (building the graph)
- If stuck > 30 seconds, restart the app
- Large heaps (>100MB) take longer

### Can't Find the Leak?
- Look for objects with high **retained size**
- Check the **Comparison** view, not Summary
- Search for your variable names (Ctrl+F works!)
- Focus on `(closure)` and `(array)` entries

---

## 📚 Want to Learn More?

### Essential Reading
- 📘 [Node.js Official Guide - Memory Diagnostics](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot)
- 📖 [V8's Memory Management Deep Dive](https://v8.dev/blog/trash-talk)

### Advanced Topics
- [Understanding V8's Garbage Collector](https://v8.dev/blog/concurrent-marking)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling)

### Tools to Explore
- **heapdump** - Programmatic heap snapshots
- **clinic.js** - Performance profiling suite
- **0x** - Flamegraph profiling
- **node --inspect-brk** - Debug from first line

---

## 🎉 Congratulations!

You've just learned how to:
- ✅ Connect Chrome DevTools to Node.js
- ✅ Take and analyze heap snapshots
- ✅ Identify memory leak patterns
- ✅ Fix and verify memory leaks

**Next steps:**
1. Try creating your own memory leak scenarios
2. Profile a real application you're working on
3. Set up memory monitoring in production
4. Share your knowledge with your team!

---


## 📝 Quick Reference

```bash
# Commands
npm install          # Setup
npm run leaky       # Run leaky version
npm run fixed       # Run fixed version

# URLs
http://localhost:3000      # App
chrome://inspect/#devices  # DevTools connector

# Curl commands
curl http://localhost:3000/leak  # Trigger leak
curl http://localhost:3000/       # Health check
```

---

*Happy debugging! Remember: every developer creates memory leaks. The good ones know how to find and fix them.* 