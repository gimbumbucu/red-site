document.addEventListener("DOMContentLoaded", () => {
    // 1. 네비게이션 스크롤 이동
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. 문의 양식
    const supportForm = document.getElementById("supportForm");
    if (supportForm) {
        supportForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("✅ 관리자 권한으로 문의가 접수되었습니다! 디스코드 채널에서도 확인 가능합니다.");
            supportForm.reset();
        });
    }

    // 3. 스크롤 네비게이션 효과
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

    // 4. 애니메이션 옵저버
    const cards = document.querySelectorAll('.glass-card');
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

    // =====================================
    //  로컬 스토리지 (임시 DB) 회원가입 & 로그인
    // =====================================
    checkAuth();

    // 회원가입 전송
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            // 브라우저 캐시에 유저 목록 저장
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.email === email)) {
                alert('이미 가입된 이메일입니다!');
                return;
            }

            users.push({ name, email, password, role: 'User' });
            localStorage.setItem('users', JSON.stringify(users));
            alert('🎉 회원가입 완료!\n이제 로그인 화면에서 접속해 주세요.');
            closeModal('registerModal');
            document.getElementById('registerForm').reset();
            openModal('loginModal'); 
        });
    }

    // 로그인 전송
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // =============== 🚨 총괄 스태프 하드코딩 인증 구역 ===============
            if (email === 'tgimbumbucu@gmail.com' && password === 'aa235700!!') {
                localStorage.setItem('user', JSON.stringify({ email: email, role: 'SuperAdmin', name: '총괄 관리자' }));
                alert("👑 [SuperAdmin] 로그인 승인!\n스태프 최고 권한 패널이 활성화되었습니다.");
                closeModal('loginModal');
                document.getElementById('loginForm').reset();
                checkAuth();
                return;
            }
            // ==========================================================

            // 일반 유저 검증
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('user', JSON.stringify({ email: email, role: user.role, name: user.name }));
                alert(`환영합니다, ${user.name}님!`);
                closeModal('loginModal');
                document.getElementById('loginForm').reset();
                checkAuth();
            } else {
                alert('이메일 또는 비밀번호가 일치하지 않습니다.');
            }
        });
    }
}); 

// =======================
//   모달창 제어 및 화면 렌더링
// =======================
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}

// 로그인 상태 체크 함수
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const btnLogin = document.getElementById('btnLoginBtn');
    const btnReg = document.getElementById('btnRegBtn');
    const btnLogout = document.getElementById('btnLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    const logoSpan = document.querySelector('.logo span');

    if (user) {
        if(btnLogin) btnLogin.style.display = "none";
        if(btnReg) btnReg.style.display = "none";
        if(btnLogout) {
            btnLogout.style.display = "inline-block";
            btnLogout.innerText = user.name + " 님 (로그아웃)";
        }

        // 스태프 권한인 경우
        if (user.role === 'SuperAdmin') {
            if(adminPanel) adminPanel.style.display = "block";
            if(logoSpan) logoSpan.innerHTML = "<strong style='color:#ffcc00;'>[STAFF] Administrator Mode</strong>";
        } else {
            if(adminPanel) adminPanel.style.display = "none";
            if(logoSpan) logoSpan.innerText = "Admin JumpMap";
        }
    } else {
        if(btnLogin) btnLogin.style.display = "inline-block";
        if(btnReg) btnReg.style.display = "inline-block";
        if(btnLogout) btnLogout.style.display = "none";
        if(adminPanel) adminPanel.style.display = "none";
        if(logoSpan) logoSpan.innerText = "Admin JumpMap";
    }
}

// 로그아웃
function logout() {
    localStorage.removeItem('user');
    checkAuth();
    alert('✅ 정상적으로 로그아웃되었습니다.');
}
