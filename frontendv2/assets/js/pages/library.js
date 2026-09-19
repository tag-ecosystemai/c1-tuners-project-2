// SABILEARN — Library behavior
// Folder cards and the material grid now include real backend courses
// (GET /courses/) and their real materials (GET /materials/course/:id),
// merged with the local mock/demo courses and materials. The backend has
// no endpoints yet for material size/thumbnails, so those fields show a
// neutral placeholder for real materials instead of being invented.

const MATERIAL_ICONS = {
  document: '\u{1F4C4}',
  slides: '\u{1F5B5}',
  recording: '\u{1F3A7}',
  image: '\u{1F5BC}',
};

const FILTER_TYPE_MAP = {
  all: null,
  documents: 'document',
  recordings: 'recording',
  slides: 'slides',
  images: 'image',
};

let allMaterialsFlat = [];
let backendCourses = []; // populated from GET /courses/, used for the upload dropdown and merged folders/materials

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function guessMaterialType(fileType) {
  const t = (fileType || '').toLowerCase();
  if (t.includes('presentation') || t.includes('powerpoint')) return 'slides';
  if (t.includes('audio')) return 'recording';
  if (t.includes('image')) return 'image';
  return 'document';
}

// Loads every real backend course's materials (GET /materials/course/:id)
// and shapes both courses and materials into the same fields the rest of
// this page already renders for mock courses/materials.
async function loadBackendFoldersAndMaterials(courses) {
  const results = await Promise.all(courses.map(async (c) => {
    let backendMaterials = [];
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/course/${c.id}`, {}, 8000);
      if (res.ok) {
        const data = await res.json();
        backendMaterials = data.materials || [];
      }
    } catch (err) {
      console.warn('Sabilearn: could not load materials for course', c.id, err);
    }
    const materials = backendMaterials.map((m) => ({
      id: String(m.id),
      courseId: String(c.id),
      courseCode: c.code || 'COURSE',
      title: m.filename,
      ext: (m.filename.split('.').pop() || '').toUpperCase(),
      size: '—',
      date: m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString() : '',
      type: guessMaterialType(m.file_type),
      isNew: false,
    }));
    return { course: sabilearnBackendCourseToUi(c, materials.length), materials };
  }));
  return {
    folders: results.map((r) => r.course),
    materials: results.flatMap((r) => r.materials),
  };
}

function renderFolders(courses) {
  const wrap = document.getElementById('folder-grid');
  wrap.innerHTML = courses.map((c) => `
    <div class="card folder-card">
      <div class="folder-card-top">
        <div class="folder-icon folder-icon-${c.color}">\u{1F4C1}</div>
        <span class="folder-materials-count">${c.materialsCount} materials</span>
      </div>
      <span class="badge">${c.code}</span>
      <h4>${c.title}</h4>
      <div class="instructor">${c.instructor}</div>
      <div class="folder-card-footer">
        <a href="../courses/course.html?course=${c.id}&tab=materials" class="open-folder">Open folder</a>
        <a href="../courses/course.html?course=${c.id}&tab=materials" class="card-link">View materials →</a>
      </div>
    </div>
  `).join('');
}

function renderMaterials(materials) {
  const wrap = document.getElementById('material-grid');
  if (materials.length === 0) {
    wrap.innerHTML = `<p style="color:var(--color-text-faint); grid-column:1/-1;">No materials match this filter yet.</p>`;
    return;
  }
  wrap.innerHTML = materials.map((m) => `
    <a href="material-viewer.html?material=${m.id}&course=${m.courseId}" class="card material-card" style="display:flex;">
      <div class="material-icon">${MATERIAL_ICONS[m.type] || '\u{1F4C4}'}</div>
      <div class="material-card-body">
        <div class="material-card-title">${m.title}</div>
        <div class="material-card-meta">${m.ext} · ${m.size} · ${m.date}</div>
      </div>
      ${m.isNew ? '<span class="material-new-dot"></span>' : ''}
    </a>
  `).join('');
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [courseData, materialsData] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
  ]);

  // Populate the upload dropdown from the real backend so uploads land on
  // actual courses; fall back to the mock course list if the backend isn't
  // reachable.
  const uploadSelect = document.getElementById('upload-course-select');
  backendCourses = await sabilearnGetBackendCourses();
  uploadSelect.innerHTML = backendCourses.length
    ? backendCourses.map((c) => `<option value="${c.id}">${c.code ? `${c.code} · ` : ''}${c.name}</option>`).join('')
    : courseData.courses.map((c) => `<option value="${c.id}">${c.code} · ${c.title}</option>`).join('');

  const { folders: backendFolders, materials: backendMaterials } = await loadBackendFoldersAndMaterials(backendCourses);
  const allFolders = courseData.courses.concat(backendFolders);

  renderFolders(allFolders);
  document.getElementById('course-count').textContent = `${allFolders.length} course${allFolders.length === 1 ? '' : 's'}`;

  const courseLookup = Object.fromEntries(courseData.courses.map((c) => [c.id, c]));
  const mockMaterialsFlat = Object.entries(materialsData).flatMap(([courseId, items]) =>
    items.map((m) => ({ ...m, courseId, courseCode: courseLookup[courseId]?.code }))
  );
  allMaterialsFlat = mockMaterialsFlat.concat(backendMaterials);
  allMaterialsFlat.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));

  renderMaterials(allMaterialsFlat);

  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const wanted = FILTER_TYPE_MAP[tab.dataset.filter];
      renderMaterials(wanted ? allMaterialsFlat.filter((m) => m.type === wanted) : allMaterialsFlat);
    });
  });

  document.getElementById('library-search-input').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderMaterials(allMaterialsFlat.filter((m) => m.title.toLowerCase().includes(q)));
  });

  wireUploadModal();
});

function wireUploadModal() {
  const modal = document.getElementById('upload-modal');
  const selectStep = document.getElementById('upload-step-select');
  const processingStep = document.getElementById('upload-step-processing');
  const doneBtn = document.getElementById('upload-done');
  const dropzone = document.getElementById('upload-dropzone');
  const filesListEl = document.getElementById('selected-files-list');
  const uploadStartBtn = document.getElementById('upload-start');
  const processingListEl = document.getElementById('processing-files-list');
  let selectedFiles = [];
  let currentCourseId = null;
  let currentUseBackend = false;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  fileInput.accept = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.mp3,.m4a,.wav';
  document.body.appendChild(fileInput);

  function fmtSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderSelectedFiles() {
    uploadStartBtn.disabled = selectedFiles.length === 0;
    uploadStartBtn.textContent = selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : 'Upload';
    filesListEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="list-item-card" style="padding:12px 16px; margin-bottom:8px;">
        <div>
          <div class="list-item-title" style="font-size:13.5px;">${f.name}</div>
          <div class="list-item-meta">${fmtSize(f.size)}</div>
        </div>
        <button type="button" class="material-menu-btn" data-remove="${i}">Remove</button>
      </div>
    `).join('');
    filesListEl.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(Number(btn.dataset.remove), 1);
        renderSelectedFiles();
      });
    });
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    selectedFiles = selectedFiles.concat(Array.from(fileInput.files));
    fileInput.value = '';
    renderSelectedFiles();
  });
  ['dragover', 'dragenter'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--color-primary)'; }));
  ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.style.borderColor = ''; }));
  dropzone.addEventListener('drop', (e) => {
    selectedFiles = selectedFiles.concat(Array.from(e.dataTransfer.files));
    renderSelectedFiles();
  });

  function openModal() {
    selectedFiles = [];
    renderSelectedFiles();
    modal.classList.add('is-open');
    selectStep.style.display = 'block';
    processingStep.classList.remove('is-active');
    doneBtn.style.display = 'none';
  }
  function closeModal() { modal.classList.remove('is-open'); }

  document.getElementById('upload-material-btn').addEventListener('click', openModal);
  document.getElementById('upload-cancel').addEventListener('click', closeModal);
  document.getElementById('upload-background')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // After any successful backend upload (initial pass or retry), re-pull
  // this course's materials so the grid reflects it without a full reload.
  async function refreshAfterBackendUpload() {
    const { folders, materials } = await loadBackendFoldersAndMaterials(backendCourses);
    const courseData = await loadJSON('../../data/mock/courses.json');
    renderFolders(courseData.courses.concat(folders));
    const courseLookup = Object.fromEntries(courseData.courses.map((c) => [c.id, c]));
    const mockMaterialsFlat = (await loadJSON('../../data/mock/materials.json'));
    const mockFlat = Object.entries(mockMaterialsFlat).flatMap(([cid, items]) =>
      items.map((m) => ({ ...m, courseId: cid, courseCode: courseLookup[cid]?.code }))
    );
    allMaterialsFlat = mockFlat.concat(materials);
    renderMaterials(allMaterialsFlat);
  }

  // Uploads one already-picked file to the real backend and reflects the
  // result in its row. Reused by the initial pass and by Retry.
  // backend/app/routes/materials.py can return HTTP 200 with just a
  // failure message and no "material" key (e.g. course not found), so
  // success is decided by the presence of that key, not res.ok alone.
  async function uploadOneFile(i) {
    const f = selectedFiles[i];
    const statusEl = document.getElementById(`proc-status-${i}`);
    const iconEl = document.getElementById(`proc-icon-${i}`);
    statusEl.textContent = 'Uploading…';
    statusEl.style.color = '';
    iconEl.textContent = '⟳';
    try {
      const formData = new FormData();
      formData.append('course_id', currentCourseId);
      formData.append('file', f);
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/upload`, {
        method: 'POST',
        body: formData,
      }, 30000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      if (!data || !data.material) throw new Error(data?.message || 'Backend did not return an uploaded material');
      statusEl.textContent = 'Ready';
      iconEl.textContent = '✓';
      return true;
    } catch (err) {
      console.warn('Sabilearn: material upload failed.', err);
      statusEl.textContent = "We couldn't process this material";
      statusEl.style.color = 'var(--color-warn-text)';
      iconEl.innerHTML = `<button class="btn btn-secondary btn-sm" data-retry="${i}">Retry</button>`;
      return false;
    }
  }

  // Retries one file from the original simulated mock/demo flow — same
  // "processing" animation, ending in Ready, so mock upload retry works
  // the same way it always visually promised to (previously unwired).
  function retrySimulatedFile(i) {
    const statusEl = document.getElementById(`proc-status-${i}`);
    const iconEl = document.getElementById(`proc-icon-${i}`);
    const stages = ['Reading your material', 'Preparing content', 'Making it searchable', 'Ready'];
    iconEl.textContent = '⟳';
    statusEl.style.color = '';
    stages.forEach((stage, si) => {
      setTimeout(() => {
        statusEl.textContent = stage;
        if (stage === 'Ready') iconEl.textContent = '✓';
      }, (si + 1) * 400);
    });
  }

  // Delegated once — the processing list's innerHTML gets replaced on
  // every upload run, so a per-run listener would leak/duplicate.
  processingListEl?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-retry]');
    if (!btn) return;
    const i = Number(btn.dataset.retry);
    if (!currentUseBackend) { retrySimulatedFile(i); return; }
    const ok = await uploadOneFile(i);
    if (ok) await refreshAfterBackendUpload();
  });

  uploadStartBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    currentCourseId = document.getElementById('upload-course-select').value;
    currentUseBackend = backendCourses.some((c) => String(c.id) === String(currentCourseId));

    selectStep.style.display = 'none';
    processingStep.classList.add('is-active');

    processingListEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="list-item-card" style="padding:14px 16px; margin-bottom:8px;" id="proc-file-${i}">
        <div>
          <div class="list-item-title" style="font-size:13.5px;">${f.name}</div>
          <div class="list-item-meta" id="proc-status-${i}">Uploading…</div>
        </div>
        <span id="proc-icon-${i}">⟳</span>
      </div>
    `).join('');

    if (!currentUseBackend) {
      // No real backend course selected (mock demo course) — keep the
      // original simulated upload flow.
      const stages = ['Reading your material', 'Preparing content', 'Making it searchable', 'Ready'];
      const willFailLast = selectedFiles.length > 1;
      selectedFiles.forEach((f, i) => {
        const isFailing = willFailLast && i === selectedFiles.length - 1;
        const statusEl = document.getElementById(`proc-status-${i}`);
        const iconEl = document.getElementById(`proc-icon-${i}`);
        stages.forEach((stage, si) => {
          setTimeout(() => {
            if (isFailing && si === stages.length - 1) {
              statusEl.textContent = "We couldn't process this material";
              statusEl.style.color = 'var(--color-warn-text)';
              iconEl.innerHTML = `<button class="btn btn-secondary btn-sm" data-retry="${i}">Retry</button>`;
            } else {
              statusEl.textContent = stage;
              if (stage === 'Ready') iconEl.textContent = '✓';
            }
            if (i === selectedFiles.length - 1 && si === stages.length - 1) {
              doneBtn.style.display = 'inline-flex';
            }
          }, (i * 200) + (si + 1) * 450);
        });
      });
      return;
    }

    // Real backend course selected — actually upload each file.
    let anySucceeded = false;
    for (let i = 0; i < selectedFiles.length; i++) {
      const ok = await uploadOneFile(i);
      if (ok) anySucceeded = true;
    }
    doneBtn.style.display = 'inline-flex';
    if (anySucceeded) await refreshAfterBackendUpload();
  });

  doneBtn.addEventListener('click', closeModal);
}
