// Supabase Client & Admin State
let supabaseClient = null;
let isAdminLoggedIn = localStorage.getItem("ZULLZ_ADMIN_LOGGED_IN") === "true";

// Inisialisasi Supabase
function initSupabase() {
    const url = localStorage.getItem("SUPABASE_URL");
    const key = localStorage.getItem("SUPABASE_ANON_KEY");

    if (url && key) {
        try {
            supabaseClient = window.supabase.createClient(url, key);
            document.getElementById("supabaseStatusText").innerText = "Terhubung ke Supabase ✅";
            document.getElementById("supabaseStatusText").style.color = "#10b981";
            loadPublicData();
            if (isAdminLoggedIn) {
                loadAdminData();
            }
        } catch (err) {
            console.error("Gagal inisialisasi Supabase:", err);
            document.getElementById("supabaseStatusText").innerText = "Koneksi Gagal ❌";
            document.getElementById("supabaseStatusText").style.color = "#ef4444";
        }
    } else {
        document.getElementById("supabaseStatusText").innerText = "Belum dikonfigurasi (Klik ⚙️)";
        document.getElementById("supabaseStatusText").style.color = "#d97706";
    }
}

// Load Data untuk Publik (Hanya yang berstatus approved / disetujui)
async function loadPublicData() {
    if (!supabaseClient) return;

    try {
        // Fetch Classes
        const { data: classes, error: classErr } = await supabaseClient.from("classes").select("*");
        if (!classErr && classes) {
            renderClassesForPublic(classes);
            document.getElementById("statClasses").innerText = classes.length;
        }

        // Fetch Approved Mentors only
        const { data: mentors, error: mentorErr } = await supabaseClient
            .from("mentors")
            .select("*")
            .eq("status", "approved");

        if (!mentorErr && mentors) {
            renderMentorsForPublic(mentors);
            document.getElementById("statMentors").innerText = mentors.length;
        }

        // Fetch Total Approved Enrollments count
        const { count: studentCount, error: enrollErr } = await supabaseClient
            .from("enrollments")
            .select("*", { count: 'exact', head: true })
            .eq("status", "approved");

        if (!enrollErr && studentCount !== null) {
            document.getElementById("statStudents").innerText = studentCount;
        }
    } catch (e) {
        console.error("Error loading public data:", e);
    }
}

// Load Data untuk Admin Dashboard
async function loadAdminData() {
    if (!supabaseClient || !isAdminLoggedIn) return;

    try {
        // Fetch all enrollments
        const { data: enrollments, error: enrollErr } = await supabaseClient.from("enrollments").select("*");
        if (!enrollErr && enrollments) {
            renderEnrollmentsTable(enrollments);
            document.getElementById("countEnroll").innerText = enrollments.length;
        }

        // Fetch all mentors
        const { data: mentors, error: mentorErr } = await supabaseClient.from("mentors").select("*");
        if (!mentorErr && mentors) {
            renderMentorsTable(mentors);
            document.getElementById("countMentors").innerText = mentors.length;
        }
    } catch (e) {
        console.error("Error loading admin data:", e);
    }
}

// Render Publik Kelas
function renderClassesForPublic(classes) {
    const grid = document.getElementById("classesGrid");
    grid.innerHTML = "";

    if (!classes || classes.length === 0) {
        grid.innerHTML = `<div class="empty-state"><p>Belum ada data kelas di tabel <code>classes</code>.</p></div>`;
        return;
    }

    classes.forEach(item => {
        const card = document.createElement("div");
        card.className = "class-card";
        card.innerHTML = `
            <div class="class-header">
                <span class="class-category">${item.category || 'Umum'}</span>
                <span class="class-badge free">Gratis</span>
                <h3>${item.title}</h3>
            </div>
            <div class="class-body">
                <p class="class-desc">${item.description || '-'}</p>
                <div class="class-meta">
                    <div class="mentor-info">
                        <div class="mentor-avatar">${(item.mentor_name || 'M').charAt(0)}</div>
                        <span>${item.mentor_name || 'Mentor'}</span>
                    </div>
                    <span>📅 ${item.date || 'Segera'}</span>
                </div>
                <button class="btn btn-primary btn-block" style="margin-top: 16px;" onclick="openEnrollModal('${item.title}', ${item.id})">Daftar Kelas Gratis</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Render Publik Mentor
function renderMentorsForPublic(mentors) {
    const grid = document.getElementById("mentorsGrid");
    grid.innerHTML = "";

    if (!mentors || mentors.length === 0) {
        grid.innerHTML = `<div class="empty-state"><p>Belum ada mentor yang disetujui oleh admin.</p></div>`;
        return;
    }

    mentors.forEach(mentor => {
        const card = document.createElement("div");
        card.className = "mentor-card";
        card.innerHTML = `
            <div class="mentor-lg-avatar">${(mentor.name || 'M').charAt(0)}</div>
            <h3>${mentor.name}</h3>
            <div class="mentor-role">${mentor.role || 'Mentor'}</div>
            <p>${mentor.bio || '-'}</p>
        `;
        grid.appendChild(card);
    });
}

// Render Admin Tables
function renderEnrollmentsTable(enrollments) {
    const tbody = document.getElementById("enrollmentsTableBody");
    tbody.innerHTML = "";

    if (!enrollments || enrollments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Belum ada pendaftaran peserta.</td></tr>`;
        return;
    }

    enrollments.forEach(item => {
        const tr = document.createElement("tr");
        const statusBadge = item.status === 'approved' 
            ? '<span class="status-badge approved">Disetujui</span>' 
            : '<span class="status-badge pending">Pending</span>';

        tr.innerHTML = `
            <td><strong>${item.full_name}</strong></td>
            <td>${item.email}</td>
            <td>${item.whatsapp}</td>
            <td>#${item.class_id}</td>
            <td>${statusBadge}</td>
            <td>
                ${item.status !== 'approved' ? `<button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="approveEnrollment(${item.id})">Terima</button>` : '✓ Diterima'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMentorsTable(mentors) {
    const tbody = document.getElementById("mentorsTableBody");
    tbody.innerHTML = "";

    if (!mentors || mentors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Belum ada pendaftaran mentor.</td></tr>`;
        return;
    }

    mentors.forEach(item => {
        const tr = document.createElement("tr");
        const statusBadge = item.status === 'approved' 
            ? '<span class="status-badge approved">Disetujui</span>' 
            : '<span class="status-badge pending">Pending</span>';

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.role}</td>
            <td>${item.bio || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                ${item.status !== 'approved' ? `<button class="btn btn-accent" style="padding: 4px 10px; font-size: 12px;" onclick="approveMentor(${item.id})">Setujui</button>` : '✓ Disetujui'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Admin Actions
async function approveEnrollment(id) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from("enrollments").update({ status: 'approved' }).eq("id", id);
    if (error) {
        alert("Gagal menyetujui: " + error.message);
    } else {
        showToast("Peserta berhasil diterima!");
        loadAdminData();
        loadPublicData();
    }
}

async function approveMentor(id) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from("mentors").update({ status: 'approved' }).eq("id", id);
    if (error) {
        alert("Gagal menyetujui mentor: " + error.message);
    } else {
        showToast("Mentor berhasil disetujui dan kini tampil di publik!");
        loadAdminData();
        loadPublicData();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initSupabase();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    const enrollModal = document.getElementById("enrollModal");
    const mentorModal = document.getElementById("mentorModal");
    const configModal = document.getElementById("configModal");
    const adminLoginModal = document.getElementById("adminLoginModal");
    const adminDashboardModal = document.getElementById("adminDashboardModal");

    // Supabase Config
    document.getElementById("openConfigBtn").addEventListener("click", () => {
        configModal.classList.add("active");
        document.getElementById("supabaseUrl").value = localStorage.getItem("SUPABASE_URL") || "";
        document.getElementById("supabaseKey").value = localStorage.getItem("SUPABASE_ANON_KEY") || "";
    });

    document.getElementById("closeConfigModal").addEventListener("click", () => configModal.classList.remove("active"));

    document.getElementById("configForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const url = document.getElementById("supabaseUrl").value.trim();
        const key = document.getElementById("supabaseKey").value.trim();
        localStorage.setItem("SUPABASE_URL", url);
        localStorage.setItem("SUPABASE_ANON_KEY", key);
        configModal.classList.remove("active");
        showToast("Konfigurasi Supabase disimpan!");
        initSupabase();
    });

    // Admin Login Flow
    document.getElementById("openAdminLoginBtn").addEventListener("click", () => {
        if (isAdminLoggedIn) {
            adminDashboardModal.classList.add("active");
            loadAdminData();
        } else {
            adminLoginModal.classList.add("active");
        }
    });

    document.getElementById("closeAdminLoginModal").addEventListener("click", () => adminLoginModal.classList.remove("active"));
    document.getElementById("closeAdminDashboardModal").addEventListener("click", () => adminDashboardModal.classList.remove("active"));

    document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("adminEmail").value.trim();
        const pass = document.getElementById("adminPass").value.trim();

        // Verifikasi dengan kredensial aman dari env/config.js
        if (email === window.ZULLZ_ENV.ADMIN_EMAIL && pass === window.ZULLZ_ENV.ADMIN_PASS_HASH) {
            isAdminLoggedIn = true;
            localStorage.setItem("ZULLZ_ADMIN_LOGGED_IN", "true");
            adminLoginModal.classList.remove("active");
            adminDashboardModal.classList.add("active");
            showToast("Login Admin Berhasil! Selamat datang, Administrator.");
            loadAdminData();
        } else {
            alert("Email atau Password Admin salah! Periksa kembali kredensial Anda.");
        }
        e.target.reset();
    });

    document.getElementById("adminLogoutBtn").addEventListener("click", () => {
        isAdminLoggedIn = false;
        localStorage.removeItem("ZULLZ_ADMIN_LOGGED_IN");
        adminDashboardModal.classList.remove("active");
        showToast("Logout Admin berhasil.");
    });

    // Admin Tabs
    const tabBtns = document.querySelectorAll(".admin-tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            tabBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            const targetTab = e.target.getAttribute("data-tab");
            document.querySelectorAll(".admin-tab-content").forEach(c => c.style.display = "none");
            document.getElementById(targetTab).style.display = "block";
        });
    });

    // Mentor & Enroll Modals
    document.getElementById("openMentorModalBtn").addEventListener("click", () => mentorModal.classList.add("active"));
    document.getElementById("registerMentorBtn").addEventListener("click", () => mentorModal.classList.add("active"));
    document.getElementById("closeModal").addEventListener("click", () => enrollModal.classList.remove("active"));
    document.getElementById("closeMentorModal").addEventListener("click", () => mentorModal.classList.remove("active"));

    window.addEventListener("click", (e) => {
        if (e.target === enrollModal) enrollModal.classList.remove("active");
        if (e.target === mentorModal) mentorModal.classList.remove("active");
        if (e.target === configModal) configModal.classList.remove("active");
        if (e.target === adminLoginModal) adminLoginModal.classList.remove("active");
        if (e.target === adminDashboardModal) adminDashboardModal.classList.remove("active");
    });

    // Enroll Form -> Supabase (Default status: pending)
    document.getElementById("enrollForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!supabaseClient) {
            alert("Harap atur konfigurasi Supabase terlebih dahulu (klik ⚙️ Supabase).");
            return;
        }

        const class_id = document.getElementById("classIdInput").value;
        const full_name = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const whatsapp = document.getElementById("whatsapp").value;

        const { error } = await supabaseClient
            .from("enrollments")
            .insert([{ class_id, full_name, email, whatsapp, status: 'pending' }]);

        if (error) {
            alert("Gagal mendaftar ke Supabase: " + error.message);
        } else {
            enrollModal.classList.remove("active");
            showToast("Pendaftaran berhasil dikirim! Menunggu persetujuan Admin.");
            e.target.reset();
        }
    });

    // Mentor Form -> Supabase (Default status: pending)
    document.getElementById("mentorForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!supabaseClient) {
            alert("Harap atur konfigurasi Supabase terlebih dahulu (klik ⚙️ Supabase).");
            return;
        }

        const name = document.getElementById("mentorName").value;
        const role = document.getElementById("mentorRole").value;
        const bio = document.getElementById("mentorBio").value;

        const { error } = await supabaseClient
            .from("mentors")
            .insert([{ name, role, bio, status: 'pending' }]);

        if (error) {
            alert("Gagal mendaftar mentor ke Supabase: " + error.message);
        } else {
            mentorModal.classList.remove("active");
            showToast("Pendaftaran mentor dikirim! Menunggu verifikasi Admin.");
            e.target.reset();
        }
    });
}

// Open Enroll Modal
function openEnrollModal(className, classId) {
    const modal = document.getElementById("enrollModal");
    document.getElementById("modalClassName").innerText = `Daftar: ${className}`;
    document.getElementById("classIdInput").value = classId;
    modal.classList.add("active");
}

// Toast
function showToast(message) {
    const toast = document.getElementById("toastNotification");
    const toastMsg = document.getElementById("toastMessage");
    toastMsg.innerText = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}
