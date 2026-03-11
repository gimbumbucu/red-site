document.addEventListener("DOMContentLoaded", () => {
    // 1. 네비게이션 스크롤 이동
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 2. 스크롤 네비게이션 블러 효과
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

    // 3. 요소 페이드인 애니메이션 (갤러리 사진 포함)
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

    // =====================================
    //  로컬 스토리지 DB 초기화 및 인증 관리
    // =====================================
    checkAuth();
    showGlobalNoticeIfActive();

    // 회원가입 전송
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            // 🚨 비밀번호 일치 검사 로직 추가 (보안 강화)
            if (password !== passwordConfirm) {
                alert('입력하신 두 비밀번호가 서로 일치하지 않습니다!\n다시 확인해 주세요.');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.email === email)) {
                alert('이미 가입된 이메일입니다!'); return;
            }

            users.push({ name, email, password, role: 'User', status: 'Active' });
            localStorage.setItem('users', JSON.stringify(users));
            alert('🎉 회원가입 완료!\n소중한 계정이 생성되었습니다. 이제 로그인 해주세요.');
            closeModal('registerModal');
            regForm.reset();
            openModal('loginModal'); 
        });
    }

    // 로그인
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // 관리자 하드코딩 패스
            let user = null;
            if (email === 'tgimbumbucu@gmail.com' && password === 'aa235700!!') {
                user = { email: email, role: 'SuperAdmin', name: '레드 총괄관리자', status: 'Active' };
            } else {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                user = users.find(u => u.email === email && u.password === password);
            }
            
            if (user) {
                if(user.status === 'Banned') {
                    alert('🚨 해당 계정은 스태프에 의해 영구 차단되었습니다.');
                    return;
                }
                localStorage.setItem('user', JSON.stringify(user));
                if(user.role === 'SuperAdmin' || user.role === 'Staff') {
                    alert(`👑 [${user.role}] 로그인 승인!\n스태프 관리 권한 창이 활성화되었습니다.`);
                } else {
                    alert(`환영합니다, ${user.name}님!`);
                }
                closeModal('loginModal');
                loginForm.reset();
                checkAuth();
            } else {
                alert('이메일 또는 비밀번호가 일치하지 않습니다.');
            }
        });
    }

    // =====================================
    //  데이터베이스: 문의사항(Inquiries) 로직
    // =====================================
    const supportForm = document.getElementById("supportForm");
    if (supportForm) {
        supportForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const inputs = supportForm.querySelectorAll('input, select, textarea');
            const robloxId = inputs[0].value;
            const type = inputs[1].value;
            const content = inputs[2].value;
            const authorEmail = JSON.parse(localStorage.getItem('user'))?.email || "비회원 방문자";

            const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
            inquiries.push({
                id: Date.now(),
                author: authorEmail,
                robloxId: robloxId,
                type: type,
                content: content,
                status: 'Pending',
                date: new Date().toLocaleString()
            });
            localStorage.setItem('inquiries', JSON.stringify(inquiries));

            alert("✅ 문의가 정상적으로 접수되었습니다! 스태프가 확인 후 조치합니다.");
            supportForm.reset();
            updateInquiryCountBadge();
        });
    }

    // =====================================
    //  스태프 전용 관리 기능 저장소 연동
    // =====================================
    const noticeForm = document.getElementById("noticeForm");
    if(noticeForm) {
        noticeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById("noticeMessage").value;
            const active = document.getElementById("noticeActive").checked;
            localStorage.setItem('globalNotice', JSON.stringify({text: msg, active: active}));
            alert(`✅ 전면 공지사항이 ${active ? '활성화' : '비활성화'}되어 저장되었습니다!`);
            closeModal('noticeManagerModal');
            showGlobalNoticeIfActive(); // 관리자 폰에도 바로 띄우기
        });
    }
    // =====================================
    //  비밀번호 찾기(재설정) 시스템 추가
    // =====================================
    const btnVerifyForgot = document.getElementById('btnVerifyForgot');
    const forgotForm = document.getElementById('forgotForm');
    let validatedUserIndex = -1; // 재설정할 회원 정보의 순서 기억

    // 1단계: 계정 존재 여부 확인
    if (btnVerifyForgot) {
        btnVerifyForgot.addEventListener('click', () => {
            const email = document.getElementById('forgotEmail').value.trim();
            const name = document.getElementById('forgotName').value.trim();
            
            if(!email || !name) {
                alert("이메일과 닉네임을 모두 입력해주세요."); return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            validatedUserIndex = users.findIndex(u => u.email === email && u.name === name);

            if (validatedUserIndex !== -1) {
                alert(`✅ 계정 확인 성공!\n${users[validatedUserIndex].name}님의 정보를 찾았습니다.\n새롭게 사용할 비밀번호를 입력해주세요.`);
                // 정보 입력 칸 닫고, 비밀번호 변경 칸 스르륵 열기
                document.getElementById('forgotEmail').readOnly = true;
                document.getElementById('forgotName').readOnly = true;
                document.getElementById('newPasswordGroup').style.display = 'block';
                document.getElementById('btnVerifyForgot').style.display = 'none';
                document.getElementById('btnResetPassword').style.display = 'block';
                document.getElementById('forgotNewPassword').required = true;
            } else {
                alert('❌ 일치하는 계정 정보가 없습니다. 이메일과 닉네임을 다시 확인해주세요!');
            }
        });
    }

    // 2단계: 새 비밀번호로 저장(초기화)
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('forgotNewPassword').value;

            if (validatedUserIndex !== -1) {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                users[validatedUserIndex].password = newPassword; // 비번 덮어씌우기
                localStorage.setItem('users', JSON.stringify(users));

                alert('🔑 비밀번호가 완벽하게 재설정되었습니다!\n새로운 비밀번호로 로그인해주세요.');
                
                // 폼 상태 원래대로 초기화 (다음을 위해)
                document.getElementById('forgotEmail').readOnly = false;
                document.getElementById('forgotName').readOnly = false;
                document.getElementById('newPasswordGroup').style.display = 'none';
                document.getElementById('btnVerifyForgot').style.display = 'block';
                document.getElementById('btnResetPassword').style.display = 'none';
                forgotForm.reset();
                validatedUserIndex = -1;

                closeModal('forgotPasswordModal');
                openModal('loginModal');
            }
        });
    }

}); // DOMContentLoaded 닫기

// =======================
//   모달 및 관리자 액션 로직
// =======================
function openModal(modalId) { document.getElementById(modalId).style.display = "block"; }
function closeModal(modalId) { document.getElementById(modalId).style.display = "none"; }
window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) modal.style.display = "none";
    });
}

// 스태프 등급 이상 패널 렌더링
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // UI 요소들
    const btnLogin = document.getElementById('btnLoginBtn');
    const btnReg = document.getElementById('btnRegBtn');
    const btnLogout = document.getElementById('btnLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    const logoSpan = document.querySelector('.logo span');

    updateInquiryCountBadge();

    if (user) {
        if(btnLogin) btnLogin.style.display = "none";
        if(btnReg) btnReg.style.display = "none";
        if(btnLogout) {
            btnLogout.style.display = "inline-block";
            btnLogout.innerText = user.name + " 님 (로그아웃)";
        }
        
        // 권한 체크
        if (user.role === 'SuperAdmin' || user.role === 'Staff') {
            if(adminPanel) adminPanel.style.display = "block";
            if(logoSpan) logoSpan.innerHTML = `<strong style='color:#ffcc00;'>[STAFF - ${user.role}] Mode</strong>`;
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

function logout() {
    localStorage.removeItem('user');
    checkAuth();
    alert('✅ 안전하게 로그아웃되었습니다.');
}

// 뱃지 숫자 새로고침
function updateInquiryCountBadge() {
    const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
    const pendingCount = inquiries.filter(i => i.status === 'Pending').length;
    const badge = document.getElementById('inquiryCountCheck');
    if(badge) badge.innerText = pendingCount;
}

// 공지사항 띄우기
function showGlobalNoticeIfActive() {
    const notice = JSON.parse(localStorage.getItem('globalNotice'));
    if(notice && notice.active && notice.text.trim() !== "") {
        document.getElementById('globalNoticeText').innerText = notice.text;
        openModal('globalNoticeModal');
    }
}

// =======================
//   스태프 강력 권한 콘솔 관리
// =======================
function openAdminModal(modalId) {
    if(modalId === 'userManagerModal') renderUserTable();
    if(modalId === 'inquiryManagerModal') renderInquiryTable();
    if(modalId === 'noticeManagerModal') {
        const notice = JSON.parse(localStorage.getItem('globalNotice'));
        if(notice) {
            document.getElementById('noticeMessage').value = notice.text;
            document.getElementById('noticeActive').checked = notice.active;
        }
    }
    openModal(modalId);
}

// 1. 유저 관리 테이블 렌더링
function renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    tbody.innerHTML = '';

    if(users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">가입한 유저가 없습니다.</td></tr>';
        return;
    }

    users.forEach((u, index) => {
        const roleText = u.role === 'Staff' ? '<span style="color:#f39c12">스태프(Staff)</span>' : '일반유저';
        const stBadg = u.status === 'Banned' ? '<span class="status-badge danger">차단됨</span>' : '<span class="status-badge success">정상</span>';
        
        tbody.innerHTML += `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><strong>${roleText}</strong></td>
                <td>${stBadg}</td>
                <td>
                    <button class="btn-action success" onclick="setStaff(${index}, true)">스태프 임명</button>
                    <button class="btn-action danger" onclick="toggleBan(${index})">차단 / 해제</button>
                </td>
            </tr>
        `;
    });
}

function setStaff(index, isStaff) {
    const users = JSON.parse(localStorage.getItem('users'));
    users[index].role = isStaff ? 'Staff' : 'User';
    localStorage.setItem('users', JSON.stringify(users));
    renderUserTable();
    alert('권한이 변경되었습니다!');
}
function toggleBan(index) {
    const users = JSON.parse(localStorage.getItem('users'));
    users[index].status = users[index].status === 'Banned' ? 'Active' : 'Banned';
    localStorage.setItem('users', JSON.stringify(users));
    renderUserTable();
}

// 2. 문의 내역 관리 테이블 렌더링
function renderInquiryTable() {
    const tbody = document.getElementById('inquiryTableBody');
    const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
    tbody.innerHTML = '';
    
    // 최신순 정렬
    inquiries.sort((a,b) => b.id - a.id);

    if(inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">접수된 새로운 문의가 없습니다.</td></tr>';
        return;
    }

    inquiries.forEach((iq) => {
        const badgeClass = iq.status === 'Pending' ? 'pending' : 'resolved';
        const badgeText = iq.status === 'Pending' ? '답변 대기' : '처리 완료';

        tbody.innerHTML += `
            <tr>
                <td>${iq.robloxId}<br><small style="color:#aaa;">${iq.author}</small></td>
                <td><span style="color:#3498db; font-weight:bold;">${iq.type}</span></td>
                <td style="max-width:250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${iq.content}">
                    ${iq.content}
                </td>
                <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    <button class="btn-action success" onclick="resolveInquiry(${iq.id})">✔ 완료처리</button>
                    <button class="btn-action danger" onclick="deleteInquiry(${iq.id})">삭제</button>
                </td>
            </tr>
        `;
    });
}

function resolveInquiry(id) {
    const inquiries = JSON.parse(localStorage.getItem('inquiries'));
    const target = inquiries.find(i => i.id === id);
    if(target) {
        target.status = 'Resolved';
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
        renderInquiryTable();
        updateInquiryCountBadge();
        alert('문의 상태가 [처리 완료]로 변경되었습니다.');
    }
}
function deleteInquiry(id) {
    if(!confirm("이 문의 내역을 완전히 삭제하시겠습니까?")) return;
    let inquiries = JSON.parse(localStorage.getItem('inquiries'));
    inquiries = inquiries.filter(i => i.id !== id);
    localStorage.setItem('inquiries', JSON.stringify(inquiries));
    renderInquiryTable();
    updateInquiryCountBadge();
}
