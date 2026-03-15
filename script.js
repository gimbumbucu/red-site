// 🟢 script.js 맨 윗부분 수정
const SUPABASE_URL = 'https://humphqmvfbslumfupxlb.supabase.co'; // [General] 탭에서 확인 가능!
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bXBocW12ZmJzbHVtZnVweGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA2NjUsImV4cCI6MjA4OTEyNjY2NX0.GhNnCIf51lQj-CINq-4vt1DqDTsfsUZVg3Yjtg7W_Ow'; // 방금 복사한 그 키
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
    // 1. [기존 유지] 네비게이션 스크롤 이동
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 2. [기존 유지] 스크롤 네비게이션 블러 효과
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(8, 8, 10, 0.95)';
            navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(8, 8, 10, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // 3. [기존 유지] 요소 페이드인 애니메이션
    const cards = document.querySelectorAll('.glass-card, .gallery-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        card.style.transition = "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        observer.observe(card);
    });

    // 4. 초기 데이터 로드
    checkAuth();
    showGlobalNoticeIfActive();

    // =====================================
    // 🔐 회원가입 (Supabase 연동)
    // =====================================
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            if (password !== passwordConfirm) {
                alert('비밀번호가 서로 일치하지 않습니다!'); return;
            }

            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name } }
            });

            if (error) alert('가입 실패: ' + error.message);
            else {
                // profiles 테이블에 추가 정보 저장
                await _supabase.from('profiles').insert([{ id: data.user.id, username: name, email: email }]);
                alert('🎉 가입 성공! 이제 로그인해 주세요.');
                closeModal('registerModal');
                openModal('loginModal');
            }
        });
    }

    // =====================================
    // 🔑 로그인 (Supabase 연동)
    // =====================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

            if (error) alert('로그인 실패: ' + error.message);
            else {
                localStorage.setItem('user', JSON.stringify({ 
                    id: data.user.id, email: data.user.email, name: data.user.user_metadata.full_name 
                }));
                alert(`환영합니다, ${data.user.user_metadata.full_name}님!`);
                location.reload(); 
            }
        });
    }

    // =====================================
    // 📝 문의사항 접수 (Supabase 연동)
    // =====================================
    const supportForm = document.getElementById("supportForm");
    if (supportForm) {
        supportForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = supportForm.querySelectorAll('input, select, textarea');
            const { error } = await _supabase.from('tickets_log').insert([{
                roblox_name: inputs[0].value,
                type: inputs[1].value,
                content: inputs[2].value
            }]);

            if (error) alert("접수 실패");
            else {
                alert("✅ 문의가 정상적으로 접수되었습니다!");
                supportForm.reset();
            }
        });
    }

    // =====================================
    // 📢 공지사항 설정 (관리자 전용)
    // =====================================
    const noticeForm = document.getElementById("noticeForm");
    if(noticeForm) {
        noticeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { error } = await _supabase.from('notices').insert([{
                content: document.getElementById("noticeMessage").value,
                is_active: document.getElementById("noticeActive").checked
            }]);

            if (error) alert("저장 실패");
            else {
                alert("✅ 공지사항이 적용되었습니다.");
                closeModal('noticeManagerModal');
                location.reload();
            }
        });
    }
});

// =====================================
// 👑 권한 및 관리자 액션 로직
// =====================================
async function checkAuth() {
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    const btnLogin = document.getElementById('btnLoginBtn');
    const btnReg = document.getElementById('btnRegBtn');
    const btnLogout = document.getElementById('btnLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    const logoSpan = document.querySelector('.logo span');

    if (sessionUser) {
        btnLogin.style.display = "none";
        btnReg.style.display = "none";
        btnLogout.style.display = "inline-block";
        btnLogout.innerText = sessionUser.name + " 님 (로그아웃)";

        // 스태프 확인
        const { data: staffData } = await _supabase.from('staff').select('*').eq('email', sessionUser.email);
        
        if (sessionUser.email === 'tgimbumbucu@gmail.com' || (staffData && staffData.length > 0)) {
            adminPanel.style.display = "block";
            const role = (sessionUser.email === 'tgimbumbucu@gmail.com') ? 'SuperAdmin' : staffData[0].role_name;
            logoSpan.innerHTML = `<strong style='color:#ffcc00;'>[${role}] Mode</strong>`;
        }
    }
}

// 스태프 임명/해제 기능
async function promoteToStaff(email, name) {
    const role = prompt("역할 입력 (예: Staff, Manager)", "Staff");
    if(!role) return;
    await _supabase.from('staff').insert([{ email: email, username: name, role_name: role }]);
    alert("임명 완료");
    renderUserTable();
}

async function demoteFromStaff(email) {
    if(!confirm("스태프 권한을 해제할까요?")) return;
    await _supabase.from('staff').delete().eq('email', email);
    alert("해제 완료");
    renderUserTable();
}

// 유저 관리 테이블 렌더링 (DB 데이터 기준)
async function renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    const { data: profiles } = await _supabase.from('profiles').select('*');
    const { data: staffList } = await _supabase.from('staff').select('*');

    tbody.innerHTML = '';
    profiles.forEach(u => {
        const staffInfo = staffList.find(s => s.email === u.email);
        const roleText = staffInfo ? `<span style="color:#f39c12">${staffInfo.role_name}</span>` : '일반유저';
        
        tbody.innerHTML += `
            <tr>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><strong>${roleText}</strong></td>
                <td><span class="status-badge success">정상</span></td>
                <td>
                    ${staffInfo ? 
                        `<button class="btn-action danger" onclick="demoteFromStaff('${u.email}')">해제</button>` : 
                        `<button class="btn-action success" onclick="promoteToStaff('${u.email}', '${u.username}')">임명</button>`
                    }
                </td>
            </tr>`;
    });
}

// 공지사항 팝업 띄우기
async function showGlobalNoticeIfActive() {
    const { data } = await _supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(1);
    if (data && data[0] && data[0].is_active) {
        document.getElementById('globalNoticeText').innerText = data[0].content;
        openModal('globalNoticeModal');
    }
}

// 모달 제어
function openModal(id) { document.getElementById(id).style.display = "block"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function logout() { localStorage.removeItem('user'); location.reload(); }
function openAdminModal(id) { if(id==='userManagerModal') renderUserTable(); openModal(id); }
