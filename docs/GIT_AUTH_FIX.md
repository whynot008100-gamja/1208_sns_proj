# Git Push 권한 오류 해결 가이드

## 문제 상황

```
remote: Permission to whynot008100-gamja/1208_sns_proj.git denied to imgruit.
fatal: unable to access 'https://github.com/whynot008100-gamja/1208_sns_proj.git/': The requested URL returned error: 403
```

**원인**: `imgruit` 계정으로 인증되어 있지만, `whynot008100-gamja` 저장소에 push 권한이 없습니다.

## 해결 방법

### 방법 1: Personal Access Token 사용 (권장)

1. **GitHub에서 Personal Access Token 생성**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" 클릭
   - Note: `1208_sns_proj` 입력
   - Expiration: 원하는 기간 선택
   - Scopes: `repo` 체크 (전체 저장소 권한)
   - "Generate token" 클릭
   - **토큰을 복사해두세요** (다시 볼 수 없습니다)

2. **Windows Credential Manager에서 기존 인증 정보 제거**
   ```powershell
   # Windows Credential Manager 열기
   cmdkey /list
   
   # GitHub 관련 인증 정보 제거
   cmdkey /delete:git:https://github.com
   ```

3. **다시 push 시도**
   ```powershell
   git push -u origin main
   ```
   - Username: `whynot008100-gamja` (또는 `Bong_gamja`)
   - Password: **Personal Access Token** (비밀번호가 아님!)

### 방법 2: SSH 키 사용

1. **SSH 키 생성 (이미 있다면 생략)**
   ```powershell
   ssh-keygen -t ed25519 -C "whynot008100@gmail.com"
   ```

2. **SSH 키를 GitHub에 추가**
   - `~/.ssh/id_ed25519.pub` 파일 내용 복사
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Key에 붙여넣기 후 저장

3. **원격 저장소 URL을 SSH로 변경**
   ```powershell
   git remote set-url origin git@github.com:whynot008100-gamja/1208_sns_proj.git
   ```

4. **SSH 연결 테스트**
   ```powershell
   ssh -T git@github.com
   ```

5. **Push 시도**
   ```powershell
   git push -u origin main
   ```

### 방법 3: GitHub CLI 사용

1. **GitHub CLI 설치**
   ```powershell
   winget install --id GitHub.cli
   ```

2. **GitHub CLI로 로그인**
   ```powershell
   gh auth login
   ```
   - GitHub.com 선택
   - HTTPS 선택
   - 브라우저에서 인증

3. **자동으로 Git 인증 설정**
   ```powershell
   gh auth setup-git
   ```

4. **Push 시도**
   ```powershell
   git push -u origin main
   ```

## 현재 설정 확인

- **원격 저장소**: `https://github.com/whynot008100-gamja/1208_sns_proj.git`
- **Git 사용자**: `Bong_gamja` (whynot008100@gmail.com)
- **인증된 계정**: `imgruit` (권한 없음)

## 빠른 해결 (가장 간단)

1. **Windows Credential Manager에서 GitHub 인증 정보 제거**
   ```powershell
   cmdkey /delete:git:https://github.com
   ```

2. **다시 push 시도**
   ```powershell
   git push -u origin main
   ```

3. **인증 정보 입력**
   - Username: `whynot008100-gamja` 또는 `Bong_gamja`
   - Password: **Personal Access Token** (GitHub에서 생성)

## Personal Access Token 생성 단계별 가이드

1. https://github.com/settings/tokens 접속
2. "Generate new token" → "Generate new token (classic)" 클릭
3. Token name: `1208_sns_proj` 입력
4. Expiration: 원하는 기간 선택 (예: 90 days)
5. Select scopes:
   - ✅ `repo` (전체 저장소 권한)
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ security_events
6. "Generate token" 클릭
7. 생성된 토큰을 복사 (예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
8. 이 토큰을 비밀번호처럼 사용

## 주의사항

- Personal Access Token은 비밀번호처럼 안전하게 보관하세요
- 토큰이 유출되면 즉시 GitHub에서 삭제하세요
- 토큰은 다시 볼 수 없으므로 생성 시 복사해두세요

## 참고 자료

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager)
- [GitHub CLI](https://cli.github.com/)

