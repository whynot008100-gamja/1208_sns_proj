# Personal Access Token으로 Git 인증 설정하기

## 단계별 가이드

### 1단계: GitHub에서 Personal Access Token 생성

1. **GitHub 웹사이트 접속**
   - https://github.com/settings/tokens 접속
   - 또는 GitHub → 우측 상단 프로필 → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **새 토큰 생성**
   - "Generate new token" → "Generate new token (classic)" 클릭
   - Note: `1208_sns_proj` 입력
   - Expiration: 원하는 기간 선택 (예: 90 days 또는 No expiration)
   - Select scopes:
     - ✅ **repo** (전체 저장소 권한)
       - 이렇게 하면 하위 항목들이 자동으로 선택됩니다:
         - repo:status
         - repo_deployment
         - public_repo
         - repo:invite
         - security_events

3. **토큰 생성 및 복사**
   - "Generate token" 클릭
   - 생성된 토큰을 **즉시 복사**하세요 (예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - ⚠️ **주의**: 이 토큰은 다시 볼 수 없습니다!

### 2단계: Windows Credential Manager에서 기존 인증 정보 제거

PowerShell에서 다음 명령어 실행:

```powershell
# GitHub 관련 인증 정보 확인
cmdkey /list | findstr github

# GitHub 인증 정보 제거 (있다면)
cmdkey /delete:git:https://github.com
```

### 3단계: Git Push 시도

```powershell
git push -u origin main
```

인증 정보 입력:
- **Username**: `whynot008100-gamja` 또는 `Bong_gamja`
- **Password**: 위에서 생성한 **Personal Access Token** (일반 비밀번호가 아님!)

### 4단계: 인증 정보 저장 확인

첫 push 성공 후, Windows Credential Manager에 인증 정보가 저장됩니다.
이후부터는 자동으로 인증됩니다.

## 문제 해결

### 토큰이 작동하지 않는 경우

1. **토큰 만료 확인**: GitHub에서 토큰이 만료되지 않았는지 확인
2. **권한 확인**: `repo` scope가 선택되어 있는지 확인
3. **Credential Manager 재설정**: 
   ```powershell
   cmdkey /delete:git:https://github.com
   git push -u origin main
   ```

### 다른 계정으로 인증된 경우

```powershell
# 모든 GitHub 인증 정보 제거
cmdkey /delete:git:https://github.com

# 올바른 계정으로 다시 인증
git push -u origin main
```

## 보안 권장사항

1. **토큰 보안**: Personal Access Token은 비밀번호처럼 안전하게 보관하세요
2. **토큰 만료**: 가능하면 만료일을 설정하세요
3. **최소 권한**: 필요한 scope만 선택하세요
4. **토큰 삭제**: 더 이상 사용하지 않으면 GitHub에서 즉시 삭제하세요

## 참고

- Personal Access Token은 일반 비밀번호가 아닙니다
- 토큰은 `ghp_`로 시작하는 긴 문자열입니다
- Username은 GitHub 사용자명 또는 이메일 주소입니다

