# 🔍 re:view — AI 기반 광고성 리뷰 탐지 서비스

![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Java](https://img.shields.io/badge/Java-007396?style=flat&logo=java&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)

<br>

## 👥 팀 소개

| 역할 | 이름 |
|------|------|
| 팀장 | 류은규 |
| 팀원 | 소채연 |
| 팀원 | 소현서 |

<br>

## 📖 프로젝트 소개

소비자는 제품 구매 전 리뷰를 주요 판단 기준으로 활용하지만, 광고성 리뷰의 증가로 인해 리뷰에 대한 신뢰도는 지속적으로 낮아지고 있습니다.

본 프로젝트는 사용자가 리뷰를 판단하는 데 참고할 수 있는 **의사결정 보조 시스템(Decision Support System)** 을 목표로 개발되었습니다. 리뷰 텍스트와 이미지를 기반으로 광고성 리뷰 집단과의 유사도를 분석하고, 이를 시각화 및 요약하여 사용자가 보다 신뢰성 있는 구매 결정을 내릴 수 있도록 지원합니다.

<br>

## 🖼️ 화면 구성

| 시작 페이지 | 메인 페이지 | 분석 완료 |
|:-----------:|:----------:|:--------:|
| ![시작](./screenshots/start.png) | ![메인](./screenshots/main.png) | ![분석완료](./screenshots/result.png) |

> 스크린샷은 `screenshots/` 폴더에 `start.png`, `main.png`, `result.png` 이름으로 넣어주세요.

<br>

## ⚙️ 기술 스택

| 구분 | 사용 기술 |
|------|----------|
| Frontend | React, Recharts |
| Backend | Spring Boot, Spring Security (JWT), Spring Data JPA |
| AI Server | FastAPI, Python, Sentence-Transformers (all-MiniLM-L6-v2) |
| LLM / OCR | Google Gemini API, Tesseract OCR |
| Database | MySQL |

<br>

## 🧩 시스템 아키텍처

```
[React Client] ──(JWT Auth)──▶ [Spring Boot Server] ──(REST API)──▶ [FastAPI AI Engine]
                                        │                                      │
                                  [MySQL DB]                         [Fine-tuned Model]
```

<br>

## 🔍 유사도 분석 프로세스

```
1. 데이터 수집
   └── 광고성 리뷰 800개, 비광고성 리뷰 567개 수집

2. 모델 사용
   └── SentenceTransformer: all-MiniLM-L6-v2

3. 파인튜닝 & 문장 임베딩
   └── 광고성끼리 가깝게, 비광고성끼리 가깝게 학습
   └── 리뷰를 384차원 벡터로 변환

4. 키워드 가중치 적용
   └── 광고 관련 단어 +가중치 / 비광고 관련 단어 -가중치

5. 통계 분석
   └── p-value < 0.001, Cohen's d로 그룹 간 차이 검증
```

<br>

## 🧠 핵심 아이디어

### 1. 대조학습 기반 임베딩 파인튜닝

SentenceTransformer(all-MiniLM-L6-v2)를 기반으로 학습 데이터를 구성하였습니다.

| 쌍 | 유사도 |
|----|--------|
| 광고 리뷰 ↔ 광고 리뷰 | 1.0 |
| 비광고 리뷰 ↔ 비광고 리뷰 | 1.0 |
| 광고 리뷰 ↔ 비광고 리뷰 | 0.0 |

### 2. 키워드 가중치 기반 보정

`협찬`, `제공`, `체험단` 등 광고성 표현에 가중치를 부여하여 딥러닝 임베딩과 도메인 지식을 결합한 **하이브리드 분석 구조**를 설계하였습니다.

### 3. 중심 벡터 기반 유사도 분석

광고 리뷰와 비광고 리뷰 각각의 평균 벡터를 계산한 뒤, 코사인 유사도로 "광고성 리뷰 집단과 구조적으로 얼마나 유사한가"를 수치화하였습니다.

<br>

## 📊 통계적 검증

### Welch's t-test
광고 리뷰 집단과 비광고 리뷰 집단의 유사도 분포 차이를 검증한 결과, **p-value < 0.001** 수준의 유의미한 차이를 확인하였습니다.

### Cohen's d

| 모델 | 광고 평균 유사도 | 비광고 평균 유사도 | Cohen's d |
|------|:--------------:|:----------------:|:---------:|
| 기존 모델 | 0.911 | 0.904 | 0.078 |
| 파인튜닝 + 키워드 가중치 | 0.802 | 0.679 | **0.564** |

결과적으로 약 **7.2배** 높은 집단 분리 효과를 확인하였습니다.

<br>

## 📐 성능 평가 방식

일반적인 분류 모델과 달리, 광고성 리뷰는 절대적인 정답을 정의하기 어렵습니다. 실제로 협찬을 받았더라도 진솔하게 작성된 리뷰가 존재할 수 있으며, 반대의 경우도 마찬가지입니다.

따라서 본 프로젝트는 개별 리뷰의 정답 여부보다 **광고성 리뷰 집단과 일반 리뷰 집단이 임베딩 공간에서 얼마나 명확하게 분리되는가**를 핵심 지표로 설정하였습니다.

<br>

## 📊 결과 요약

- 대조학습 기반 파인튜닝과 키워드 가중치 보정으로 집단 분리도(Cohen's d) **약 7.2배 향상**
- **p-value < 0.001** 수준의 통계적 유의성 확보
- Gemini 기반 리뷰 요약 기능과 OCR 기능으로 사용자 경험 개선
- Spring Boot, FastAPI, React를 연계한 원스톱 서비스 구현

<br>

## 💡 프로젝트를 통한 인사이트

초기에는 모델 성능 개선을 위해 더 큰 모델로 교체하는 방향을 고려하였습니다. 그러나 비교 분석 결과, MiniLM의 경량성과 임베딩 성능이 우수하다는 점을 확인하였고, 모델 교체 대신 다음 세 가지에 집중하였습니다.

- 데이터 품질 개선
- 대조학습 기반 파인튜닝
- 키워드 가중치 보정

그 결과 경량 모델을 유지하면서도 의미 있는 성능 향상을 달성할 수 있었습니다.
