let root = null;
let historyStack = [];
let currentTab = "video";
let currentItem = null;
let courseId = null;
let favorites = JSON.parse(localStorage.getItem('fav_courses') || '[]');

// 🔥 Loader
function showLoader() {
    document.getElementById("main").innerHTML = `
    <div class="loader">
        <span></span><span></span><span></span>
    </div>`;
}

// 🔗 Update URL (Hidden Params)
function updateURL(isBack = false) {
    if (!isBack) {
        history.pushState({
            courseId,
            historyStack: JSON.parse(JSON.stringify(historyStack)),
            currentItem
        }, "", window.location.pathname);
    }
}

// 🚀 Load Courses
async function showCourse() {
    document.getElementById("main").className = "course-view";
    document.getElementById("title").innerHTML = `<div class="ticker-wrap"><div class="ticker" id="ticker-text">TARGET BOARD FREE BATCH - LOADING...</div></div>`;
    document.getElementById("backBtn").style.display = "none";

    showLoader();

    let res = await fetch('/api/course');
    let json = await res.json();
    let data = json.data || json;
    let html = "";

    let courseNames = data.map(c => c.name).join(" - ");
    let tickerContent = `TARGET BOARD FREE BATCH - ${courseNames} - TARGET BOARD FREE BATCH`;
    const tickerEl = document.getElementById("ticker-text");
    if (tickerEl) tickerEl.innerText = tickerContent;

    data.forEach(c => {
        let isFav = favorites.some(f => f._id === c._id);
        html += `
        <div class="course" onclick="openCourse('${c._id}')">
            <div class="course-title"><span class="brand-prefix">MADXT2Z</span> ${c.name}</div>
            <div class="thumb-container">
                <img src="${c.courseImage || 'https://i.postimg.cc/7ZSf5gty/TG.png'}" onerror="this.src='https://i.postimg.cc/7ZSf5gty/TG.png'">
                <div class="price-tag">₹ FREE</div>
                <div class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event, ${JSON.stringify(c).replace(/"/g, '&quot;')})">
                    <i class="fas fa-heart"></i>
                </div>
            </div>
        </div>`;
    });

    document.getElementById("main").innerHTML = html;

    courseId = null;
    historyStack = [];
    updateURL();
}

// 🚀 Open Course
async function openCourse(id) {
    courseId = id;
    document.getElementById("title").innerText = "Loading Subjects...";
    document.getElementById("backBtn").style.display = "inline";

    showLoader();

    try {
        let res = await fetch('/api/api?id=' + id);
        let json = await res.json();

        // Handle the specific structure of your API
        let data = json.data || json;

        if (data.children && Array.isArray(data.children)) {
            // Your API returns a root object with subjects in 'children'
            root = data.children;
        } else if (Array.isArray(data)) {
            root = data;
        } else {
            root = [data];
        }

        document.getElementById("title").innerText = "All Subjects";
        renderList(root);
        historyStack = [];
        updateURL();
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById("main").innerHTML = `
            <div style="padding:40px; text-align:center; color:#ff4757;">
                <h3>Oops! Subjects not loading.</h3>
                <p>The API at sangam.free.nf might be blocking the request.</p>
                <button onclick="openCourse('${id}')" style="background:#00ffcc; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Try Again</button>
            </div>`;
    }
}

// 🔁 Render List
function renderList(data) {
    document.getElementById("main").className = "list-view";
    let html = `
    <div class="search">
        <input type="text" placeholder="Search..." oninput="search(this.value)">
    </div>`;

    data.forEach((item, index) => {
        html += `
        <div class="item" onclick="openItemByIndex(${index})">
            <div class="course-title"><span class="brand-prefix">MADXT2Z</span> ${item.name}</div>
            <div class="thumb-container" style="display:flex; align-items:center; justify-content:center; background:#111;">
               <img src="https://i.postimg.cc/7ZSf5gty/TG.png" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="item-info">
               <span style="color:#00ffcc; font-size:11px;">Open ➜</span>
            </div>
        </div>`;
    });

    document.getElementById("main").innerHTML = html;
    window.currentList = data;
}

function openItemByIndex(index) {
    let item = window.currentList[index];
    openItem(item);
}

function findFirstContent(item) {
    if ((item.lessons && item.lessons.length) || (item.streams && item.streams.length) || (item.contents && item.contents.length)) return item;
    if (item.children && item.children.length > 0) {
        for (let child of item.children) {
            let found = findFirstContent(child);
            if (found) return found;
        }
    }
    return null;
}

function openItem(item) {
    if (item.children && item.children.length > 0) {
        // If it's a category with only one child, auto-open that child
        if (item.children.length === 1) {
            historyStack.push(item);
            openItem(item.children[0]);
            return;
        }
        historyStack.push(item);
        document.getElementById("title").innerText = item.name;
        renderList(item.children);
        updateURL();
        return;
    }

    let hasVideo = item.lessons?.length || item.streams?.length;
    let hasPdf = item.contents?.length;

    if (hasVideo || hasPdf) {
        currentItem = item;
        showContent(item);
        updateURL();
    } else {
        let found = findFirstContent(item);
        if (found) {
            currentItem = found;
            showContent(found);
            updateURL();
        } else {
            alert("No content available");
        }
    }
}

function showContent(item) {
    document.getElementById("main").className = "content-view";
    let videos = getAllVideos(item);
    let hasPdf = item.contents?.length > 0;

    // Auto-select tab based on availability
    if (videos.length === 0 && hasPdf) {
        currentTab = "pdf";
    } else {
        currentTab = "video";
    }

    let html = `
    <div class="tabs">
        <div class="tab ${currentTab === 'video' ? 'active' : ''}" onclick="switchTab(event,'video')">Video</div>
        <div class="tab ${currentTab === 'pdf' ? 'active' : ''}" onclick="switchTab(event,'pdf')">PDF</div>
    </div>
    <div id="content"></div>
    `;
    document.getElementById("main").innerHTML = html;
    renderContent();
}

function getAllVideos(item, list = [], added = new Set()) {
    item.lessons?.forEach(l => {
        let v = l.source;
        let id = v?.tpAssetId || v?.video?.assetId; // Removed fallback to l._id
        if (id && !added.has(id)) {
            added.add(id);
            list.push({ id, title: v?.title || l.title || "Video", time: v?.createdAt || l.createdAt || "" });
        }
    });
    item.streams?.forEach(s => {
        let id = s?.tpAssetId || s?.video?.assetId;
        if (id && !added.has(id)) {
            added.add(id);
            list.push({ id, title: s.title || "Video", time: s.createdAt || "" });
        }
    });
    item.contents?.forEach(c => {
        if (c.type === "video") {
            let id = c.video?.assetId || c.tpAssetId;
            if (id && !added.has(id)) {
                added.add(id);
                list.push({ id, title: c.title || "Video", time: c.createdAt || "" });
            }
        }
    });
    item.children?.forEach(child => getAllVideos(child, list, added));
    return list;
}

function renderContent() {
    let html = "";
    if (currentTab === "video") {
        let videos = getAllVideos(currentItem);
        videos.forEach(v => {
            html += `
            <div class="item lec" onclick="playVideo('${v.id}')">
                <div class="course-title">${v.title}</div>
                <div class="thumb-container">
                   <img src="${currentItem.courseImage || 'https://i.postimg.cc/7ZSf5gty/TG.png'}" onerror="this.src='https://i.postimg.cc/7ZSf5gty/TG.png'">
                   <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
            </div>`;
        });
        if (!html) html = `<div style="padding:20px;text-align:center;grid-column:1/-1;">❌ No Video Available</div>`;
    }
    if (currentTab === "pdf") {
        currentItem.contents?.forEach(p => {
            html += `
            <div class="item" onclick="openPdf('${p.pdf.url}')">
                <div class="course-title">${p.title}</div>
                <div class="thumb-container" style="display:flex; align-items:center; justify-content:center; background:#111;">
                   <img src="https://i.postimg.cc/7ZSf5gty/TG.png" style="width:100%; height:100%; object-fit:cover;">
                   <div style="position:absolute; background:rgba(0,0,0,0.6); padding:5px; border-radius:5px; font-size:15px;">📄</div>
                </div>
            </div>`;
        });
        if (!html) html = `<div style="padding:20px;text-align:center;grid-column:1/-1;">❌ No PDF Available</div>`;
    }
    document.getElementById("content").innerHTML = html;
}

function switchTab(e, tab) {
    currentTab = tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    renderContent();
}

function playVideo(id) {
    window.location.href = "player.html?id=" + id;
}

function openPdf(url) {
    let viewer = "https://mozilla.github.io/pdf.js/legacy/web/viewer.html?file=";
    window.open(viewer + encodeURIComponent(url), "_blank");
}

// 🔙 Back Logic
function goBack() {
    if (historyStack.length === 0) {
        if (courseId) {
            showCourse();
        } else {
            // Already at home
        }
        return;
    }

    historyStack.pop();

    if (historyStack.length === 0) {
        renderList(root);
        document.getElementById("title").innerText = "Categories";
    } else {
        let parent = historyStack[historyStack.length - 1];
        document.getElementById("title").innerText = parent.name;
        renderList(parent.children);
    }
}

document.getElementById("backBtn").onclick = function() {
    window.history.back();
};

// 🔍 Search
function search(q) {
    document.querySelectorAll(".item, .course").forEach(i => {
        let text = i.innerText.toLowerCase();
        i.style.display = text.includes(q.toLowerCase()) ? "flex" : "none";
    });
}

// 🔁 Physical Back Button Support
window.onpopstate = function(e) {
    if (!e.state) {
        showCourse();
        return;
    }

    courseId = e.state.courseId;
    historyStack = e.state.historyStack || [];
    currentItem = e.state.currentItem;

    if (!courseId) {
        showCourse();
    } else if (currentItem) {
        document.getElementById("backBtn").style.display = "inline";
        showContent(currentItem);
    } else if (historyStack.length > 0) {
        document.getElementById("backBtn").style.display = "inline";
        let last = historyStack[historyStack.length - 1];
        document.getElementById("title").innerText = last.name;
        renderList(last.children);
    } else {
        openCourse(courseId);
    }
};

// ⭐ Favorites Logic
function toggleFav(e, course) {
    e.stopPropagation();
    let index = favorites.findIndex(f => f._id === course._id);
    if (index > -1) {
        favorites.splice(index, 1);
        e.currentTarget.classList.remove('active');
    } else {
        favorites.push(course);
        e.currentTarget.classList.add('active');
    }
    localStorage.setItem('fav_courses', JSON.stringify(favorites));
}

function showFavs() {
    toggleMenu();
    document.getElementById("main").className = "course-view";
    document.getElementById("title").innerText = "Saved Batches";
    document.getElementById("backBtn").style.display = "inline";

    if (favorites.length === 0) {
        document.getElementById("main").innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">No saved batches found.</div>`;
        return;
    }

    let html = "";
    favorites.forEach(c => {
        html += `
        <div class="course" onclick="openCourse('${c._id}')">
            <div class="course-title"><span class="brand-prefix">MADXT2Z</span> ${c.name}</div>
            <div class="thumb-container">
                <img src="${c.courseImage || 'https://i.postimg.cc/7ZSf5gty/TG.png'}" onerror="this.src='https://i.postimg.cc/7ZSf5gty/TG.png'">
                <div class="price-tag">₹ SAVED</div>
                <div class="fav-btn active" onclick="toggleFav(event, ${JSON.stringify(c).replace(/"/g, '&quot;')})">
                    <i class="fas fa-heart"></i>
                </div>
            </div>
        </div>`;
    });
    document.getElementById("main").innerHTML = html;

    courseId = "favs";
    historyStack = [];
    updateURL();
}

// 🏠 Side Menu Actions
function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("show");
}

function goHome() {
    toggleMenu();
    showCourse();
}

// 🚀 INIT
(async function init() {
    showCourse();
})();
