import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT, LOCAL_STORAGE_KEY_BRANCHMIND, MAX_PAST_THOUGHTS_FOR_BRANCHMIND_CONTEXT } from './constants';
import type { ThoughtNode, AIAnalysisData, GeminiBranchMindResponse } from './types';
import { LANGUAGES } from './languages'; 

let thoughts: ThoughtNode[] = [];
const thoughtInput = document.getElementById('thoughtInput') as HTMLTextAreaElement;
const thoughtCardsContainer = document.getElementById('thoughtCards');
const recordButton = document.getElementById('recordButton') as HTMLButtonElement;
const statusMessagesContainer = document.getElementById('statusMessages');
const searchInput = document.getElementById('searchInput') as HTMLInputElement;

const toggleSummaryCheckbox = document.getElementById('toggleSummaryCheckbox') as HTMLInputElement;
const toggleTaggingCheckbox = document.getElementById('toggleTaggingCheckbox') as HTMLInputElement;
const toggleConnectCheckbox = document.getElementById('toggleConnectCheckbox') as HTMLInputElement;
const themeToggleCheckbox = document.getElementById('themeToggle') as HTMLInputElement;
const langToggleCheckbox = document.getElementById('langToggleCheckbox') as HTMLInputElement;
const cancelEditButton = document.getElementById('cancelEditButton') as HTMLButtonElement;

const LOCAL_STORAGE_THEME_KEY = 'branchMindTheme';
const LOCAL_STORAGE_LANG_KEY = 'branchMindLanguage';
const LOCAL_STORAGE_LANG_SELECTED_KEY = 'branchMindLangSelected'; // New key
const LOCAL_STORAGE_VISITED_KEY = 'branchmind-visited';

let currentLanguage: 'ko' | 'en' = 'ko'; 
let editingThoughtId: string | null = null;

// Parent Selector Modal elements
const parentSelectorModalOverlay = document.getElementById('parentSelectorModalOverlay') as HTMLElement;
const parentSelectorModal = document.getElementById('parentSelectorModal') as HTMLElement;
const parentSelectorList = document.getElementById('parentSelectorList') as HTMLUListElement;
const confirmParentSelectButton = document.getElementById('confirmParentSelectButton') as HTMLButtonElement;
const cancelParentSelectButton = document.getElementById('cancelParentSelectButton') as HTMLButtonElement;
let resolveParentSelect: (value: string | null | undefined) => void; 
let selectedParentInModal: string | null = null;

// Language Selector Popup elements
const languageSelectorPopupOverlay = document.getElementById('languageSelectorPopupOverlay') as HTMLElement;
const languageSelectorPopupTitle = document.getElementById('languageSelectorPopupTitle') as HTMLElement;
const selectKoreanButton = document.getElementById('selectKoreanButton') as HTMLButtonElement;
const selectEnglishButton = document.getElementById('selectEnglishButton') as HTMLButtonElement;

let ai: GoogleGenAI | null = null;
try {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in environment variables.");
  }
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
  // Error will be displayed via updateUIText or displayError
}

function getLocalizedString<K extends keyof typeof LANGUAGES['ko']>(key: K): string {
    return LANGUAGES[currentLanguage]?.[key] || LANGUAGES['en']?.[key] || key as string;
}

function setButtonLoading(isLoading: boolean, messageKey?: keyof typeof LANGUAGES['ko']) {
  if (recordButton) {
    recordButton.disabled = isLoading;
  }
  if (isLoading && messageKey && statusMessagesContainer) {
    statusMessagesContainer.innerHTML = `<div class="loading-message">${getLocalizedString(messageKey)}</div>`;
  } else if (!isLoading && statusMessagesContainer) {
    if (statusMessagesContainer.querySelector('.loading-message')) {
        clearStatusMessages();
    }
  }
}

function displayError(messageKey: keyof typeof LANGUAGES['ko']) {
  if (statusMessagesContainer) {
    statusMessagesContainer.innerHTML = `<div class="error-message">${getLocalizedString(messageKey)}</div>`;
  }
  if (recordButton) recordButton.disabled = false;
}

function clearStatusMessages() {
  if (statusMessagesContainer) {
    statusMessagesContainer.innerHTML = '';
  }
}

function formatPastThoughtsForPrompt(pastThoughts: ThoughtNode[]): string {
  const lang = LANGUAGES[currentLanguage];
  if (pastThoughts.length === 0) return lang.aiNoPastThoughts;
  return pastThoughts
    .slice(0, MAX_PAST_THOUGHTS_FOR_BRANCHMIND_CONTEXT)
    .map(p => `- "${p.userThought.substring(0, 100)}${p.userThought.length > 100 ? "..." : ""}" (ID: ${p.id}, ${lang.summaryLabel}: ${p.aiAnalysis?.summary || 'N/A'})`)
    .join("\n");
}

async function getAIAnalysis(
  userThought: string,
  options: { summary: boolean; tagging: boolean; connect: boolean },
  pastThoughtsForContext: ThoughtNode[]
): Promise<AIAnalysisData | null> {
  if (!ai) {
    displayError("errorAIInit");
    return null;
  }
  if (!options.summary && !options.tagging && !options.connect) {
    return {}; 
  }

  const lang = LANGUAGES[currentLanguage];
  const systemPrompt = lang.aiSystemPrompt;
  const promptParts = [systemPrompt];
  promptParts.push(`\n${lang.aiUserThoughtInstruction} "${userThought}"`);
  
  let responseFormatFields: string[] = [];
  if (options.summary) {
    promptParts.push(lang.aiProvideSummaryInstruction);
    responseFormatFields.push(`"summary": "${lang.aiGeneratedSummaryPlaceholder}"`);
  }
  if (options.tagging) {
    promptParts.push(lang.aiSuggestTagsInstruction);
    responseFormatFields.push('"tags": ["tag1", "tag2"]');
  }
  if (options.connect) {
    if (pastThoughtsForContext.length > 0) {
      promptParts.push(`${lang.aiReviewPastThoughtsInstruction}\n${formatPastThoughtsForPrompt(pastThoughtsForContext)}`);
      promptParts.push(lang.aiSuggestConnectionsInstruction);
    } else {
      promptParts.push(lang.aiNoPastThoughtsToConnect);
    }
    responseFormatFields.push(`"relatedIdeas": [{"suggestion": "${lang.aiRelatedIdeaPlaceholder}", "explanation": "${lang.aiExplanationPlaceholder}"}, ... ] or []`);
  }
  
  const responseFormat = `{ ${responseFormatFields.join(", ")} }`;
  promptParts.push(`\n${lang.aiResponseFormatInstruction.replace('{format}', responseFormat)}`);
  promptParts.push(lang.aiJsonResponseNote);

  const fullPrompt = promptParts.join("\n");

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.6,
        }
    });

    const text = response.text.trim();
    let jsonStr = text;
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedResponse = JSON.parse(jsonStr) as GeminiBranchMindResponse;
    const result: AIAnalysisData = {};
    if (options.summary) result.summary = parsedResponse.summary || "";
    if (options.tagging) result.tags = parsedResponse.tags || [];
    if (options.connect) result.relatedIdeas = parsedResponse.relatedIdeas || [];
    
    return result;

  } catch (error: any) {
    console.error("Error getting AI analysis:", error);
    if (error.message && error.message.toLowerCase().includes('api key not valid')) {
      displayError("errorAIBadKey");
    } else if (error.message && error.message.includes("JSON")) {
      displayError("errorAIJsonResponse");
    } else {
      displayError("errorAIAnalysis");
    }
    return null;
  }
}

function createThoughtCardElement(thought: ThoughtNode): HTMLElement {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';
  cardDiv.id = `thought-${thought.id}`;
  cardDiv.setAttribute('aria-labelledby', `thought-heading-${thought.id}`);
  cardDiv.setAttribute('aria-describedby', `thought-content-${thought.id} thought-ai-${thought.id}`);

  const lang = LANGUAGES[currentLanguage];
  const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
  const timestamp = new Date(thought.timestamp).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const thoughtIdValueSpan = `<span class="thought-id-value">${thought.id}</span>`;
  let metaInfo = `<span id="thought-heading-${thought.id}">${lang.thoughtMetaId} ${thoughtIdValueSpan}</span>`;

  if (thought.parentId) {
    const parentLink = document.createElement('a');
    parentLink.href = `#thought-${thought.parentId}`;
    parentLink.textContent = `${thought.parentId.substring(0,8)}`; // Show short ID for parent
    parentLink.addEventListener('click', (e) => {
      e.preventDefault();
      const parentCard = document.getElementById(`thought-${thought.parentId}`);
      parentCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parentCard?.classList.add('highlight');
      setTimeout(() => parentCard?.classList.remove('highlight'), 1500);
    });
    metaInfo += ` | ${lang.thoughtMetaFrom} `;
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(parentLink);
    metaInfo += tempDiv.innerHTML;
  }
  metaInfo += ` | ${lang.thoughtMetaTime} ${timestamp}`;

  let aiHTML = '';
  if (thought.aiAnalysis && (thought.aiAnalysis.summary || (thought.aiAnalysis.tags && thought.aiAnalysis.tags.length > 0) || (thought.aiAnalysis.relatedIdeas && thought.aiAnalysis.relatedIdeas.length > 0))) {
    aiHTML += `<div class="ai-section" id="thought-ai-${thought.id}" aria-label="${lang.aiAnalysisHeader}">`;
    if (thought.aiAnalysis.summary) {
      aiHTML += `<p><strong>${lang.aiSummaryPrefix}</strong> ${thought.aiAnalysis.summary}</p>`;
    }
    if (thought.aiAnalysis.tags && thought.aiAnalysis.tags.length > 0) {
      aiHTML += `<p><strong>${lang.aiTagsPrefix}</strong> ${thought.aiAnalysis.tags.map(tag => `#${tag.replace(/^#/, '')}`).join(', ')}</p>`;
    }
    if (thought.aiAnalysis.relatedIdeas && thought.aiAnalysis.relatedIdeas.length > 0) {
      aiHTML += `<div><strong>${lang.aiConnectionsPrefix}</strong><ul>`;
      thought.aiAnalysis.relatedIdeas.forEach(idea => {
        aiHTML += `<li><strong>${idea.suggestion}</strong>: ${idea.explanation}</li>`;
      });
      aiHTML += `</ul></div>`;
    }
    aiHTML += '</div>';
  }

  const cardActionsDiv = document.createElement('div');
  cardActionsDiv.className = 'card-actions';

  const editButton = document.createElement('button');
  editButton.className = 'card-action-btn';
  editButton.innerHTML = '✏️';
  editButton.setAttribute('aria-label', getLocalizedString('editThoughtLabel'));
  editButton.onclick = () => startEditThought(thought.id);
  cardActionsDiv.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'card-action-btn';
  deleteButton.innerHTML = '🗑️';
  deleteButton.setAttribute('aria-label', getLocalizedString('deleteThoughtLabel'));
  deleteButton.onclick = () => deleteThought(thought.id);
  cardActionsDiv.appendChild(deleteButton);

  const cardContentDiv = document.createElement('div');
  cardContentDiv.innerHTML = `
    <div class="meta">${metaInfo}</div>
    <div class="user-thought" id="thought-content-${thought.id}">${thought.userThought.replace(/\n/g, '<br>')}</div> 
    ${aiHTML}
  `;
  cardDiv.appendChild(cardActionsDiv);
  cardDiv.appendChild(cardContentDiv);
  return cardDiv;
}

function loadThoughts() {
  const storedThoughts = localStorage.getItem(LOCAL_STORAGE_KEY_BRANCHMIND);
  if (storedThoughts) {
    thoughts = JSON.parse(storedThoughts);
    if (thoughtCardsContainer) thoughtCardsContainer.innerHTML = ''; 
    thoughts.forEach(thought => {
        const cardElement = createThoughtCardElement(thought);
        thoughtCardsContainer?.appendChild(cardElement); 
    });
  }
}

function saveThoughts() {
  localStorage.setItem(LOCAL_STORAGE_KEY_BRANCHMIND, JSON.stringify(thoughts));
}

function startEditThought(thoughtId: string) {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (thought && thoughtInput && recordButton && cancelEditButton) {
        editingThoughtId = thoughtId;
        thoughtInput.value = thought.userThought;
        thoughtInput.focus();
        recordButton.textContent = getLocalizedString('updateButtonText');
        cancelEditButton.style.display = 'inline-block';
        cancelEditButton.textContent = getLocalizedString('cancelEditButtonText');
    }
}

function cancelEdit() {
    editingThoughtId = null;
    if (thoughtInput) thoughtInput.value = '';
    if (recordButton) recordButton.textContent = getLocalizedString('recordButtonText');
    if (cancelEditButton) cancelEditButton.style.display = 'none';
    clearStatusMessages();
}

function deleteThought(thoughtId: string) {
    if (confirm(getLocalizedString('deleteConfirmMessage').replace('{id}', thoughtId.substring(0,8)))) {
        thoughts = thoughts.filter(t => t.id !== thoughtId);
        saveThoughts();
        document.getElementById(`thought-${thoughtId}`)?.remove();
    }
}

async function selectParentThought(): Promise<string | null | undefined> {
    return new Promise((resolve) => {
        resolveParentSelect = resolve;
        selectedParentInModal = null; 

        if (!parentSelectorModalOverlay || !parentSelectorList || !parentSelectorModal) {
            console.error("Parent selector modal elements not found");
            resolve(null); 
            return;
        }
        
        parentSelectorList.innerHTML = ''; 

        const recentThoughts = thoughts.slice().reverse().slice(0, 10); // Get last 10 thoughts (reversed for recent first)

        const noParentLi = document.createElement('li');
        noParentLi.textContent = getLocalizedString('parentSelectorNoParent');
        noParentLi.dataset.id = 'null'; 
        noParentLi.onclick = () => {
            selectListItem(noParentLi);
            selectedParentInModal = null;
        };
        parentSelectorList.appendChild(noParentLi);

        recentThoughts.forEach(thought => {
            const li = document.createElement('li');
            const snippet = thought.userThought.substring(0, 50) + (thought.userThought.length > 50 ? '...' : '');
            li.innerHTML = `<span class="parent-id">ID: ${thought.id.substring(0,8)}</span> <span class="parent-snippet">${snippet}</span>`;
            li.dataset.id = thought.id;
            li.onclick = () => {
                selectListItem(li);
                selectedParentInModal = thought.id;
            };
            parentSelectorList.appendChild(li);
        });
        
        (document.getElementById('parentSelectorTitle') as HTMLElement).textContent = getLocalizedString('parentSelectorTitleText');
        (document.getElementById('confirmParentSelectButton') as HTMLButtonElement).textContent = getLocalizedString('parentSelectorConfirmButton');
        (document.getElementById('cancelParentSelectButton') as HTMLButtonElement).textContent = getLocalizedString('parentSelectorCancelButton');

        parentSelectorModalOverlay.style.display = 'flex';
    });
}

function selectListItem(selectedLi: HTMLLIElement) {
    parentSelectorList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    selectedLi.classList.add('selected');
}

if (confirmParentSelectButton) {
    confirmParentSelectButton.onclick = () => {
        if (resolveParentSelect) resolveParentSelect(selectedParentInModal);
        if (parentSelectorModalOverlay) parentSelectorModalOverlay.style.display = 'none';
    };
}

if (cancelParentSelectButton) {
    cancelParentSelectButton.onclick = () => {
        if (resolveParentSelect) resolveParentSelect(undefined); 
        if (parentSelectorModalOverlay) parentSelectorModalOverlay.style.display = 'none';
    };
}

async function recordThought() {
  if (!thoughtInput || !ai) { // ai check also ensures API key was provided
    displayError(ai ? "errorGeneric" : "errorAIInit");
    return;
  }
  const inputText = thoughtInput.value.trim();
  if (!inputText) {
    displayError("errorInputEmpty");
    return;
  }

  if (editingThoughtId) { 
    const thoughtToUpdate = thoughts.find(t => t.id === editingThoughtId);
    if (thoughtToUpdate) {
        clearStatusMessages();
        setButtonLoading(true, "statusUpdatingThought");

        thoughtToUpdate.userThought = inputText;
        thoughtToUpdate.timestamp = new Date().toISOString();
        
        saveThoughts();
        
        const oldCardElement = document.getElementById(`thought-${editingThoughtId}`);
        if (oldCardElement) {
            const newCardElement = createThoughtCardElement(thoughtToUpdate);
            oldCardElement.replaceWith(newCardElement);
        }
        
        thoughtInput.value = '';
        cancelEdit(); 
        setButtonLoading(false);
    }
  } else { 
    let parentId: string | null = null;
    try {
        const selectedParentId = await selectParentThought();
        if (selectedParentId === undefined) { 
            return; 
        }
        parentId = selectedParentId;
    } catch (error) {
        console.info("Parent selection was cancelled or failed:", error);
        return; 
    }

    clearStatusMessages();
    setButtonLoading(true, "statusLoadingAI");

    const newThought: ThoughtNode = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userThought: inputText,
      parentId: parentId,
    };

    const summaryOn = toggleSummaryCheckbox.checked;
    const taggingOn = toggleTaggingCheckbox.checked;
    const connectOn = toggleConnectCheckbox.checked; 

    let analysisSuccessful = true;
    if (summaryOn || taggingOn || connectOn) {
      const aiAnalysisResult = await getAIAnalysis(
          inputText, 
          { summary: summaryOn, tagging: taggingOn, connect: connectOn },
          thoughts 
      );
      if (aiAnalysisResult) {
        newThought.aiAnalysis = aiAnalysisResult;
      } else {
        analysisSuccessful = false; 
      }
    }
    
    if (analysisSuccessful) {
      thoughts.unshift(newThought); 
      saveThoughts();
      
      const newCardElement = createThoughtCardElement(newThought);
      thoughtCardsContainer?.prepend(newCardElement);

      thoughtInput.value = '';
      clearStatusMessages(); 
    }
    setButtonLoading(false);
  }
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggleCheckbox) themeToggleCheckbox.checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    if (themeToggleCheckbox) themeToggleCheckbox.checked = false;
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as 'light' | 'dark' | null;
  applyTheme(savedTheme || 'light'); 
}

function handleThemeToggle() {
  const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
}

function updateUIText() {
  const lang = LANGUAGES[currentLanguage];
  document.documentElement.lang = currentLanguage;

  (document.getElementById('appPageTitle') as HTMLElement).textContent = lang.titleApp;
  (document.getElementById('appTitle') as HTMLElement).textContent = lang.appName;
  if(searchInput) searchInput.placeholder = lang.searchInputPlaceholder;
  if(thoughtInput) thoughtInput.placeholder = lang.inputPlaceholder;
  
  if (editingThoughtId && recordButton && cancelEditButton) {
    recordButton.textContent = lang.updateButtonText;
    cancelEditButton.textContent = lang.cancelEditButtonText;
  } else if(recordButton) {
    recordButton.textContent = lang.recordButtonText;
  }
  
  (document.getElementById('summaryToggleLabel') as HTMLElement).textContent = lang.summaryToggleLabel;
  (document.getElementById('taggingToggleLabel') as HTMLElement).textContent = lang.taggingToggleLabel;
  (document.getElementById('connectToggleLabel') as HTMLElement).textContent = lang.connectToggleLabel;
  (document.getElementById('darkModeToggleLabel') as HTMLElement).textContent = lang.darkModeToggleLabel;
  (document.getElementById('langToggleLabelText') as HTMLElement).textContent = lang.langToggleLabelText;
  
  // Onboarding Popup
  const onboardingIntro = document.getElementById('onboardingIntro') as HTMLParagraphElement;
  if (onboardingIntro) onboardingIntro.innerHTML = getLocalizedString('onboardingIntro');
  const onboardingWhyHeader = document.getElementById('onboardingWhyHeader') as HTMLHeadingElement;
  if (onboardingWhyHeader) onboardingWhyHeader.innerHTML = getLocalizedString('onboardingWhyHeader');
  const onboardingWhyBody = document.getElementById('onboardingWhyBody') as HTMLParagraphElement;
  if (onboardingWhyBody) onboardingWhyBody.innerHTML = getLocalizedString('onboardingWhyBody');
  const onboardingFeaturesHeader = document.getElementById('onboardingFeaturesHeader') as HTMLHeadingElement;
  if (onboardingFeaturesHeader) onboardingFeaturesHeader.innerHTML = getLocalizedString('onboardingFeaturesHeader');
  const onboardingFeatureSummary = document.getElementById('onboardingFeatureSummary') as HTMLLIElement;
  if (onboardingFeatureSummary) onboardingFeatureSummary.innerHTML = getLocalizedString('onboardingFeatureSummary');
  const onboardingFeatureCategorize = document.getElementById('onboardingFeatureCategorize') as HTMLLIElement;
  if (onboardingFeatureCategorize) onboardingFeatureCategorize.innerHTML = getLocalizedString('onboardingFeatureCategorize');
  const onboardingFeatureConnect = document.getElementById('onboardingFeatureConnect') as HTMLLIElement;
  if (onboardingFeatureConnect) onboardingFeatureConnect.innerHTML = getLocalizedString('onboardingFeatureConnect');
  const onboardingPhilosophyBody = document.getElementById('onboardingPhilosophyBody') as HTMLParagraphElement;
  if (onboardingPhilosophyBody) onboardingPhilosophyBody.innerHTML = getLocalizedString('onboardingPhilosophyBody');
  const onboardingFreedomBody = document.getElementById('onboardingFreedomBody') as HTMLParagraphElement;
  if (onboardingFreedomBody) onboardingFreedomBody.innerHTML = getLocalizedString('onboardingFreedomBody');
  const closePopupButton = document.getElementById('closePopupButton') as HTMLButtonElement;
  if (closePopupButton) closePopupButton.textContent = getLocalizedString('onboardingCloseButtonText');

  // Parent Selector Modal
  const parentSelectorTitleEl = document.getElementById('parentSelectorTitle') as HTMLElement;
  if (parentSelectorTitleEl) parentSelectorTitleEl.textContent = getLocalizedString('parentSelectorTitleText');
  const confirmParentBtn = document.getElementById('confirmParentSelectButton') as HTMLButtonElement;
  if (confirmParentBtn) confirmParentBtn.textContent = getLocalizedString('parentSelectorConfirmButton');
  const cancelParentBtn = document.getElementById('cancelParentSelectButton') as HTMLButtonElement;
  if (cancelParentBtn) cancelParentBtn.textContent = getLocalizedString('parentSelectorCancelButton');
  const noParentLi = parentSelectorList?.querySelector('li[data-id="null"]');
  if (noParentLi) noParentLi.textContent = getLocalizedString('parentSelectorNoParent');
  
  // Language Selector Popup (though typically set before this, good for consistency if needed)
  if (languageSelectorPopupTitle) languageSelectorPopupTitle.textContent = getLocalizedString('languageSelectorPopupTitle');
  if (selectKoreanButton) selectKoreanButton.textContent = getLocalizedString('languageSelectorKoreanButtonText');
  if (selectEnglishButton) selectEnglishButton.textContent = getLocalizedString('languageSelectorEnglishButtonText');


  if (thoughts.length > 0 && thoughtCardsContainer) {
    thoughtCardsContainer.innerHTML = ''; 
    thoughts.forEach(thought => {
        const cardElement = createThoughtCardElement(thought);
        thoughtCardsContainer.appendChild(cardElement);
    });
  }

  if (!ai && !statusMessagesContainer?.querySelector('.error-message')) {
     displayError("errorAIInit");
  }
}

function loadLanguage() {
  const savedLang = localStorage.getItem(LOCAL_STORAGE_LANG_KEY) as 'ko' | 'en' | null;
  currentLanguage = savedLang || 'ko'; // Default to Korean if nothing is saved
  if (langToggleCheckbox) {
    langToggleCheckbox.checked = currentLanguage === 'en';
  }
}

function handleLanguageToggle() {
  currentLanguage = langToggleCheckbox.checked ? 'en' : 'ko';
  localStorage.setItem(LOCAL_STORAGE_LANG_KEY, currentLanguage);
  updateUIText();
}

function showWelcomePopup() {
  const popupOverlay = document.getElementById('welcomePopupOverlay') as HTMLElement;
  const visited = localStorage.getItem(LOCAL_STORAGE_VISITED_KEY);
  if (!visited && popupOverlay) {
    popupOverlay.style.display = 'flex';
  }
}

function closeWelcomePopup() {
  const popupOverlay = document.getElementById('welcomePopupOverlay') as HTMLElement;
  if (popupOverlay) {
    popupOverlay.style.display = 'none';
    localStorage.setItem(LOCAL_STORAGE_VISITED_KEY, 'true');
  }
}

function handleInitialLanguageSelection(selectedLang: 'ko' | 'en') {
    currentLanguage = selectedLang;
    localStorage.setItem(LOCAL_STORAGE_LANG_KEY, currentLanguage);
    localStorage.setItem(LOCAL_STORAGE_LANG_SELECTED_KEY, 'true');

    if (langToggleCheckbox) {
        langToggleCheckbox.checked = currentLanguage === 'en';
    }
    if (languageSelectorPopupOverlay) {
        languageSelectorPopupOverlay.style.display = 'none';
    }
    document.body.classList.remove('initial-load');

    // Initialize rest of the app
    loadTheme();
    updateUIText();
    showWelcomePopup(); // Show welcome popup after language selection (if it's the first time)
    loadThoughts(); 
}

function showLanguageSelectorPopup() {
    if (languageSelectorPopupOverlay && selectKoreanButton && selectEnglishButton && languageSelectorPopupTitle) {
        // Set initial text directly as updateUIText hasn't run with a chosen language yet.
        languageSelectorPopupTitle.textContent = "언어 선택 / Select Language";
        selectKoreanButton.textContent = "한국어 (Korean)";
        selectEnglishButton.textContent = "English";
        
        languageSelectorPopupOverlay.style.display = 'flex';
        selectKoreanButton.onclick = () => handleInitialLanguageSelection('ko');
        selectEnglishButton.onclick = () => handleInitialLanguageSelection('en');
    } else {
        // Fallback if elements are not found, proceed with default language
        console.warn("Language selector popup elements not found. Proceeding with default language setup.");
        document.body.classList.remove('initial-load');
        localStorage.setItem(LOCAL_STORAGE_LANG_SELECTED_KEY, 'true'); // Mark as selected to avoid loop
        initializeApp();
    }
}

function handleSearchInput() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = thoughtCardsContainer?.querySelectorAll('.card') as NodeListOf<HTMLElement>;
    cards?.forEach(card => {
        const userThought = card.querySelector('.user-thought')?.textContent?.toLowerCase() || '';
        // Adjust selector for summary to be more robust
        const aiSummaryElement = card.querySelector('.ai-section p strong');
        let aiSummary = '';
        if (aiSummaryElement && aiSummaryElement.textContent?.startsWith(getLocalizedString('aiSummaryPrefix').slice(0,5))) {
            aiSummary = aiSummaryElement.nextSibling?.textContent?.toLowerCase() || '';
        }
        
        const aiTags = Array.from(card.querySelectorAll('.ai-section p strong'))
            .find(el => el.textContent?.includes(getLocalizedString('aiTagsPrefix').slice(0,5))) 
            ?.nextSibling?.textContent?.toLowerCase() || '';

        if (userThought.includes(searchTerm) || aiSummary.includes(searchTerm) || aiTags.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function initializeApp() {
    loadTheme(); 
    loadLanguage(); 
    updateUIText(); 
    showWelcomePopup(); 
    loadThoughts();
}

document.addEventListener('DOMContentLoaded', () => {
  const languageSelected = localStorage.getItem(LOCAL_STORAGE_LANG_SELECTED_KEY);

  if (!languageSelected) {
    document.body.classList.add('initial-load');
    showLanguageSelectorPopup();
  } else {
    document.body.classList.remove('initial-load');
    initializeApp();
  }

  const closePopupButtonEl = document.getElementById('closePopupButton');
  if (closePopupButtonEl) {
    closePopupButtonEl.onclick = closeWelcomePopup;
  }

  if (recordButton) {
    recordButton.onclick = recordThought; 
  }
  if (cancelEditButton) {
    cancelEditButton.onclick = cancelEdit;
  }

  if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener('change', handleThemeToggle);
  }
  if (langToggleCheckbox) {
    langToggleCheckbox.addEventListener('change', handleLanguageToggle);
  }
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }
});

// For easier debugging from console, if needed:
if (typeof window !== 'undefined') {
  (window as any).BranchMindApp = {
    recordThought,
    closeWelcomePopup,
    deleteThought,
    startEditThought,
    thoughts,
    saveThoughts,
    loadThoughts
  };
}