const supabaseUrl = 'https://isqiofzncxzfebvoagdh.supabase.co';
const supabaseKey = 'sb_publishable_PX3OxwY_XnPemHWYOTA1ww_6CtX8AIU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    // 1. Smooth Scrolling for Navigation Links
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

    // 2. Simple Contact Form Submission Alert
    const supportForm = document.getElementById("supportForm");
    if (supportForm) {
        supportForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Prevent page reload
            alert("✅ 관리자 권한으로 문의가 접수되었습니다! 디스코드 채널에서도 확인 가능합니다.");
            supportForm.reset();
        });
    }

    // 3. Navbar background blur effect on scroll
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

    // 4. Subtle element reveal animation on scroll (Intersection Observer)
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
    //  Supabase 회원가입 & 로그인 로직 추가
    // =====================================

    // 회원가입 전송 이벤트 (Supabase 연동)
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            // Supabase에 실제 가입 요청
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        display_name: name // 닉네임 메타데이터로 저장
                    }
                }
            });

            if (error) {
                alert('가입 실패: ' + error.message);
            } else {
                alert('🎉 회원가입이 성공적으로 처리되었습니다!\n이제 로그인 화면에서 접속해 주세요!');
                closeModal('registerModal');
                regForm.reset();
                openModal('loginModal');
            }
        });
    }

    // 로그인 전송 이벤트 (Supabase 연동)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Supabase에 실제 로그인 요청
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                alert('로그인 실패: 이메일 또는 비밀번호를 다시 확인해주세요!');
            } else {
                if(email === 'tgimbumbucu@gmail.com') {
                    alert("👑 [SuperAdmin] 로그인 승인!\n스태프 최고 권한 패널이 활성화되었습니다.");
                } else {
                    alert('정상적으로 로그인되었습니다!');
                }
                closeModal('loginModal');
                loginForm.reset();
            }
        });
    }

    // ==============================================
    //  Supabase 로그인 상태 실시간 감지 (매우 중요)
    // ==============================================
    
    // 유저가 로그인/로그아웃 할 때마다 화면을 자동으로 바꿔주는 감지기
    supabase.auth.onAuthStateChange((event, session) => {
        checkAuth(session);
    });

    // 처음 홈페이지를 열었을 때 로그인되어 있는지 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
        checkAuth(session);
    });

}); // End of DOMContentLoaded

// =======================
//   모달창 열기 / 닫기
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

// =======================
//  인증 상태에 따른 화면 렌더링
// =======================
function checkAuth(session) {
    const btnLogin = document.getElementById('btnLoginBtn');
    const btnReg = document.getElementById('btnRegBtn');
    const btnLogout = document.getElementById('btnLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    const logoSpan = document.querySelector('.logo span');

    if (session && session.user) {
        // [로그인 성공 상태] - 서버에서 유저 정보 가져오기
        const email = session.user.email;
        // 등록할 때 넣어둔 이름(display_name) 가져오기. 없으면 이메일 앞부분 사용
        const name = session.user.user_metadata?.display_name || email.split('@')[0];
        
        if(btnLogin) btnLogin.style.display = "none";
        if(btnReg) btnReg.style.display = "none";
        if(btnLogout) {
            btnLogout.style.display = "inline-block";
            btnLogout.innerText = name + " 님 (로그아웃)";
        }

        // 🚨 이메일이 'tgimbumbucu@gmail.com'인 사람만 스태프 권한 부여!
        if (email === 'tgimbumbucu@gmail.com') {
            if(adminPanel) adminPanel.style.display = "block";
            if(logoSpan) logoSpan.innerHTML = "<strong style='color:#ffcc00;'>[STAFF] Administrator Mode</strong>";
        } else {
            if(adminPanel) adminPanel.style.display = "none";
            if(logoSpan) logoSpan.innerText = "Admin JumpMap";
        }
    } else {
        // [로그아웃 & 비로그인 상태]
        if(btnLogin) btnLogin.style.display = "inline-block";
        if(btnReg) btnReg.style.display = "inline-block";
        if(btnLogout) btnLogout.style.display = "none";
        if(adminPanel) adminPanel.style.display = "none";
        if(logoSpan) logoSpan.innerText = "Admin JumpMap";
    }
}

// 로그아웃 (Supabase 연동)
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("로그아웃 도중 오류가 발생했습니다: " + error.message);
    } else {
        alert("✅ 성공적으로 로그아웃되었습니다.");
    }
}
