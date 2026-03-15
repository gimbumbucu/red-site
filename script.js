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

    // 5. 초기 데이터 로드
    checkAuth();
    showGlobalNoticeIfActive();

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
                alert('비밀번호가 서로 일치하지 않습니다!'); return;
            }

            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name } }
            });

            if (error) alert('가입 실패: ' + error.message);
            else {
                await _supabase.from('profiles').insert([{ id: data.user.id, username: name, email: email }]);
                alert('🎉 가입 성공! 이제 로그인해 주세요.');
                closeModal('registerModal');
                openModal('loginModal');
            }
        });
    }

    // 🔑 로그인 로직
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

    // 📢 공지사항 설정
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
// 👑 주요 함수 (함수 선언부는 밖으로 뺌)
// =====================================

// 방문 기록 함수 (IP 수집 기능 추가 버전)
async function logVisit() {
    try {
        // 1. 외부 API를 통해 유저의 진짜 IP를 알아냅니다.
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const userIp = ipData.ip;

        // 2. 알아낸 IP를 포함해서 수파베이스에 저장합니다.
        const { error } = await _supabase
            .from('visit_logs')
            .insert([
                { 
                    page_path: window.location.pathname,
                    referrer: document.referrer || 'direct',
                    user_agent: navigator.userAgent,
                    ip_address: userIp // 이제 진짜 IP가 들어갑니다!
                }
            ]);

        if (error) throw error;
        console.log('✅ 방문 기록 저장 완료 (IP:', userIp, ')');
    } catch (err) {
        // IP 가져오기에 실패하더라도 다른 정보는 저장하도록 예외 처리
        console.error('IP 수집 실패:', err);
        await _supabase.from('visit_logs').insert([{ 
            page_path: window.location.pathname,
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent
        }]);
    }
}
