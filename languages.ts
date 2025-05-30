
export const LANGUAGES = {
  ko: {
    titleApp: "BranchMind",
    appName: "BranchMind 🌿",
    inputPlaceholder: "생각을 자유롭게 남겨보세요.",
    searchInputPlaceholder: "생각 검색...",
    recordButtonText: "기록하기 🖊️",
    updateButtonText: "생각 수정하기 💾",
    cancelEditButtonText: "수정 취소",
    summaryToggleLabel: "요약",
    taggingToggleLabel: "분류 (키워드)",
    connectToggleLabel: "연결 제안",
    darkModeToggleLabel: "다크 모드",
    langToggleLabelText: "Switch to English",
    statusLoadingAI: "AI가 생각을 정리하는 중...",
    statusUpdatingThought: "생각을 업데이트하는 중...",
    errorInputEmpty: "기록할 내용을 입력해주세요.",
    errorAIInit: "AI 기능을 초기화할 수 없습니다. API 키를 확인해주세요.",
    errorAIAnalysis: "AI 분석 중 오류가 발생했습니다.",
    errorAIBadKey: "API 키가 유효하지 않습니다. 설정을 확인해주세요.",
    errorAIJsonResponse: "AI로부터 받은 응답을 처리할 수 없습니다. (JSON 형식 오류)",
    errorGeneric: "입력 필드 또는 AI 서비스가 준비되지 않았습니다.",
    
    thoughtMetaId: "🆔 아이디:",
    thoughtMetaFrom: "🔗 이전 생각:",
    thoughtMetaTime: "🕒 시간:",
    aiAnalysisHeader: "AI 분석 결과",
    aiSummaryPrefix: "🧠 요약:",
    aiTagsPrefix: "🏷️ 분류:",
    aiConnectionsPrefix: "🔗 연결 제안:",
    summaryLabel: "요약", 
    aiNoPastThoughts: "이전 생각 없음.", 

    deleteConfirmMessage: "'{id}' 생각을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    deleteThoughtLabel: "생각 삭제",
    editThoughtLabel: "생각 수정",

    parentSelectorTitleText: "어떤 생각에서 이어갈까요?",
    parentSelectorNoParent: "🌱 새 생각 (연결 없음)",
    parentSelectorConfirmButton: "선택 완료",
    parentSelectorCancelButton: "취소",
    
    languageSelectorPopupTitle: "언어 선택 / Select Language",
    languageSelectorKoreanButtonText: "한국어 (Korean)",
    languageSelectorEnglishButtonText: "English",

    aiSystemPrompt: `You're acting as a reflection-assistant AI inside a web-based journaling app called BranchMind.
The app allows users to write free-form thoughts, and optionally receive AI help with:
- A short summary (1-2 lines)
- Suggested tags (keywords)
- 1–2 related ideas from existing entries

New Instructions:
- Only suggest related ideas if there are more than 1 total thoughts stored (i.e., if pastThoughtsForContext is not empty).
- Avoid suggesting weak or superficial links.
- Use deep contextual understanding over keyword similarity.
- Respond entirely in Korean.`,
    aiUserThoughtInstruction: "사용자가 새로운 생각을 작성했습니다:",
    aiProvideSummaryInstruction: "- 간결한 요약(1-2 문장)을 제공해주세요.",
    aiSuggestTagsInstruction: "- 2-3개의 관련 태그/키워드(예: #아이디어, #프로젝트, #회고)를 제안해주세요. 문자열 배열로 반환합니다.",
    aiReviewPastThoughtsInstruction: "- 다음 과거 생각들을 검토해주세요 (가장 최근 항목부터):",
    aiSuggestConnectionsInstruction: "- 이를 바탕으로 새로운 생각에 대한 의미 있는 관련 아이디어 1-2개를 제안해주세요. 각 관련 아이디어에는 '제안'과 '설명'이 있어야 합니다.",
    aiNoPastThoughtsToConnect: "- 사용자가 아직 과거 생각을 기록하지 않았거나 연결을 제안하기에 충분하지 않습니다 (최소 하나의 과거 생각이 필요합니다).",
    aiResponseFormatInstruction: "다음 형식의 JSON 객체로만 응답해주세요: {format}. JSON이 유효한지 확인해주세요.",
    aiJsonResponseNote: "특정 부분(요약, 태그, 관련 아이디어)이 요청되지 않았거나, 적용할 수 없거나, 관련 정보를 생성할 수 없는 경우 JSON에서 문자열 필드에는 빈 문자열을, 배열 필드에는 빈 배열을 제공해주세요. 요청된 모든 필드(요약, 태그, 관련 아이디어 - 요청된 경우)가 JSON 응답에 있는지 확인해주세요.",
    aiGeneratedSummaryPlaceholder: "생성된 요약 또는 빈 문자열",
    aiRelatedIdeaPlaceholder: "관련 아이디어 텍스트",
    aiExplanationPlaceholder: "연결 이유",

    onboardingIntro: "BranchMind는 생각을 가지처럼 뻗어나가게 기록하는 실험적인 메모 앱입니다.",
    onboardingWhyHeader: "💡 무엇을 위해 만들었나요?",
    onboardingWhyBody: "우리는 생각이 정리되지 않을 때, 아이디어가 겹치고 흩어지는 경험을 자주 합니다. 이 앱은 그런 순간에 도움을 주기 위해 설계되었습니다.",
    onboardingFeaturesHeader: "🧠 어떤 기능이 있나요?",
    onboardingFeatureSummary: "✨ <strong>요약</strong>: 내가 쓴 생각을 짧게 정리해줍니다.",
    onboardingFeatureCategorize: "📂 <strong>분류</strong>: 내용을 기반으로 자동 카테고리를 제안합니다.",
    onboardingFeatureConnect: "🔗 <strong>연결 제안</strong>: 관련된 생각들을 연결해 새로운 흐름을 만들어줍니다.",
    onboardingPhilosophyBody: "이 기능들은 모두 <strong>당신의 생각을 흐름으로 이어주는 도구</strong>이며, 사용자가 원하는 만큼만 사용할 수 있습니다. 어떤 기능이든 <em>도움이 되지 않는다면 꺼둘 수도 있고</em>, AI의 개입 정도도 조절할 수 있어요.",
    onboardingFreedomBody: "🌱 자유롭게 메모하고, 흘러가는 생각 속에서 새로운 가지를 키워보세요.",
    onboardingCloseButtonText: "시작하기",
  },
  en: {
    titleApp: "BranchMind",
    appName: "BranchMind 🌿",
    inputPlaceholder: "Write your thought here...",
    searchInputPlaceholder: "Search thoughts...",
    recordButtonText: "Record 🖊️",
    updateButtonText: "Update Thought 💾",
    cancelEditButtonText: "Cancel Edit",
    summaryToggleLabel: "Summary",
    taggingToggleLabel: "Tags (Keywords)",
    connectToggleLabel: "Connection Suggestions",
    darkModeToggleLabel: "Dark Mode",
    langToggleLabelText: "한국어로 변경",
    statusLoadingAI: "AI is processing your thought...",
    statusUpdatingThought: "Updating thought...",
    errorInputEmpty: "Please enter a thought to record.",
    errorAIInit: "Could not initialize AI. Please check your API key.",
    errorAIAnalysis: "An error occurred during AI analysis.",
    errorAIBadKey: "Invalid API key. Please check your settings.",
    errorAIJsonResponse: "Could not process response from AI. (JSON format error)",
    errorGeneric: "Input field or AI service not ready.",

    thoughtMetaId: "🆔 ID:",
    thoughtMetaFrom: "🔗 From:",
    thoughtMetaTime: "🕒 Time:",
    aiAnalysisHeader: "AI Analysis",
    aiSummaryPrefix: "🧠 Summary:",
    aiTagsPrefix: "🏷️ Tags:",
    aiConnectionsPrefix: "🔗 Connection Suggestions:",
    summaryLabel: "Summary", 
    aiNoPastThoughts: "No previous thoughts.", 

    deleteConfirmMessage: "Are you sure you want to delete thought '{id}'? This action cannot be undone.",
    deleteThoughtLabel: "Delete thought",
    editThoughtLabel: "Edit thought",

    parentSelectorTitleText: "Branch from which thought?",
    parentSelectorNoParent: "🌱 New thought (No parent)",
    parentSelectorConfirmButton: "Confirm",
    parentSelectorCancelButton: "Cancel",

    languageSelectorPopupTitle: "Select Language / 언어 선택",
    languageSelectorKoreanButtonText: "한국어 (Korean)",
    languageSelectorEnglishButtonText: "English",

    aiSystemPrompt: `You're acting as a reflection-assistant AI inside a web-based journaling app called BranchMind.
The app allows users to write free-form thoughts, and optionally receive AI help with:
- A short summary (1-2 lines)
- Suggested tags (keywords)
- 1–2 related ideas from existing entries

New Instructions:
- Only suggest related ideas if there are more than 1 total thoughts stored (i.e., if pastThoughtsForContext is not empty).
- Avoid suggesting weak or superficial links.
- Use deep contextual understanding over keyword similarity.
- Respond entirely in English.`,
    aiUserThoughtInstruction: "The user has written a new thought:",
    aiProvideSummaryInstruction: "- Provide a concise summary (1-2 sentences).",
    aiSuggestTagsInstruction: "- Suggest 2-3 relevant tags/keywords (e.g., #idea, #project, #reflection). Return as an array of strings.",
    aiReviewPastThoughtsInstruction: "- Review these past thoughts (most recent first):",
    aiSuggestConnectionsInstruction: "- Based on these, suggest 1-2 meaningful related ideas for the new thought. Each related idea should have a 'suggestion' and an 'explanation'.",
    aiNoPastThoughtsToConnect: "- The user has no past thoughts recorded yet, or not enough to suggest connections (requires at least one past thought).",
    aiResponseFormatInstruction: "Respond ONLY with a JSON object in the format: {format}. Ensure the JSON is valid.",
    aiJsonResponseNote: "If a specific part (summary, tags, relatedIdeas) was not requested, is not applicable, or no relevant information can be generated, provide an empty string for string fields or an empty array for array fields in the JSON. Ensure all requested fields (summary, tags, relatedIdeas, if requested) are present in the JSON response.",
    aiGeneratedSummaryPlaceholder: "Generated summary here or empty string",
    aiRelatedIdeaPlaceholder: "Related idea text",
    aiExplanationPlaceholder: "Reason for connection",
    
    onboardingIntro: "BranchMind is an experimental note-taking app where thoughts branch out like ideas.",
    onboardingWhyHeader: "💡 What is it for?",
    onboardingWhyBody: "We often experience moments when thoughts are disorganized, ideas overlap, and scatter. This app is designed to help in such moments.",
    onboardingFeaturesHeader: "🧠 What features does it have?",
    onboardingFeatureSummary: "✨ <strong>Summary</strong>: It briefly summarizes what you've written.",
    onboardingFeatureCategorize: "📂 <strong>Classification</strong>: It suggests automatic categories based on the content.",
    onboardingFeatureConnect: "🔗 <strong>Connection Suggestions</strong>: It connects related thoughts to create new flows.",
    onboardingPhilosophyBody: "All these features are <strong>tools to connect your thoughts into a flow</strong>, and you can use them as much as you want. If any feature is <em>not helpful, you can turn it off</em>, and you can also adjust the level of AI intervention.",
    onboardingFreedomBody: "🌱 Feel free to jot down notes and grow new branches amidst the flow of your thoughts.",
    onboardingCloseButtonText: "Get Started",
  }
};