// 🟢 1. Supabase 초기화 (변수명 _supabase로 통일)
const SUPABASE_URL = 'https://humphqmvfbslumfupxlb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bXBocW12ZmJzbHVtZnVweGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA2NjUsImV4cCI6MjA4OTEyNjY2NX0.GhNnCIf51lQj-CINq-4vt1DqDTsfsUZVg3Yjtg7W_Ow';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
    // 🚀 방문 기록 실행 (가장 먼저 실행)
    logVisit();

    // 2. [기존] 네비게이션 스크롤 이동
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 3. [기존] 스크롤 네비게이션 블러 효과
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

    // 4. [기존] 요소 페이드인 애니메이션
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

    // 5. 초기 데이터 로드 및 세션 체크
    checkAuth();

    // 🔐 회원가입 로직
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            if (password !== passwordConfirm) {
                alert('비밀번호가 서로 일치하지 않습니다!'); 
                return;
            }

            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name } }
            });

            if (error) {
                alert('가입 실패: ' + error.message);
            } else {
                await _supabase.from('profiles').insert([{ id: data.user.id, username: name, email: email }]);
                alert('🎉 가입 성공! 이제 로그인해 주세요.');
                closeModal('registerModal');
                openModal('loginModal');
            }
        });
    }

    // 🔑 로그인 로직 (세션 자동 유지 적용)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

            if (error) {
                alert('로그인 실패: 이메일이나 비밀번호를 확인해주세요.');
            } else {
                alert(`환영합니다, ${data.user.user_metadata.full_name}님!`);
                closeModal('loginModal');
                location.reload(); // 새로고침하여 네비게이션 바 상태 업데이트
            }
        });
    }

    // 🔎 비밀번호 찾기 로직 (이메일 및 닉네임 확인 후 이메일 발송)
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        document.getElementById('btnVerifyForgot').addEventListener('click', async () => {
            const email = document.getElementById('forgotEmail').value;
            const name = document.getElementById('forgotName').value;

            if (!email || !name) {
                alert('가입하신 이메일과 닉네임을 모두 입력해주세요.');
                return;
            }

            // DB에서 이메일과 닉네임 일치 여부 확인
            const { data, error } = await _supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .eq('username', name)
                .single();

            if (error || !data) {
                alert('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.');
                return;
            }

            // 일치하면 수파베이스 비밀번호 재설정 이메일 발송
            const { error: resetError } = await _supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin // 재설정 완료 후 돌아올 주소
            });

            if (resetError) {
                alert('이메일 발송에 실패했습니다.');
            } else {
                alert('✅ 비밀번호 재설정 링크를 이메일로 발송했습니다! 메일함을 확인해주세요.');
                closeModal('forgotPasswordModal');
            }
        });
    }

    // 📝 문의사항 접수
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
});


// =====================================
// 👑 주요 함수 모음
// =====================================

// 🔄 세션 유지 및 UI 업데이트 함수
async function checkAuth() {
    // 수파베이스에서 현재 세션(로그인 상태) 가져오기
    const { data: { session } } = await _supabase.auth.getSession();
    
    const btnLogin = document.getElementById('btnLoginBtn');
    const btnReg = document.getElementById('btnRegBtn');
    const btnLogout = document.getElementById('btnLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');

    if (session) {
        // 로그인 되어 있을 때 버튼 변경
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnReg) btnReg.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'inline-block';
        
        // 여기에 어드민 계정인지 확인해서 adminPanel을 보여주는 로직을 추가할 수 있습니다.
        // 예: 특정 이메일이면 adminPanel.style.display = 'block';
    } else {
        // 로그아웃 상태일 때
        if(btnLogin) btnLogin.style.display = 'inline-block';
        if(btnReg) btnReg.style.display = 'inline-block';
        if(btnLogout) btnLogout.style.display = 'none';
        if(adminPanel) adminPanel.style.display = 'none';
    }
}

// 🚪 로그아웃 함수
window.logout = async function() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        alert('로그아웃 중 오류가 발생했습니다.');
    } else {
        alert('성공적으로 로그아웃 되었습니다.');
        location.reload(); 
    }
}

// 🪟 모달(팝업창) 열기/닫기 함수
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.style.display = 'flex'; // 혹은 블록에 맞게 'block'
    }
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.style.display = 'none';
    }
}

// 방문 기록 함수 
async function logVisit() {
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const userIp = ipData.ip;

        const { error } = await _supabase.from('visit_logs').insert([{ 
            page_path: window.location.pathname,
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent,
            ip_address: userIp
        }]);

        if (error) throw error;
    } catch (err) {
        console.error('IP 수집 실패:', err);
    }
}
