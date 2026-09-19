// SABILEARN — Library behavior
// The upload dropdown and the actual upload call are wired to the backend
// (GET /courses/ and POST /materials/upload — backend/app/routes/). Folder
// cards and material browsing on this page keep using the local mock data,
// since the backend has no endpoints yet for material size/thumbnails or
// for the richer course metadata (instructor, color, materials count)
// shown here.

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
let backendCourses = []; // populated from GET /courses/, used for the upload dropdown

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
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
        <a href="#" class="open-folder">Open folder</a>
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

  renderFolders(courseData.courses);
  document.getElementById('course-count').textContent = `${courseData.courses.length} courses`;

  // Populate the upload dropdown from the real backend so uploads land on
  // actual courses; fall back to the mock course list if the backend isn't
  // reachable.
  const uploadSelect = document.getElementById('upload-course-select');
  try {
    const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {}, 8000);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const data = await res.json();
    backendCourses = data.courses || [];
  } catch (err) {
    console.warn('Sabilearn: could not reach backend for course list, using mock courses in the upload dropdown.', err);
  }
  uploadSelect.innerHTML = backendCourses.length
    ? backendCourses.map((c) => `<option value="${c.id}">${c.code ? `${c.code} · ` : ''}${c.name}</option>`).join('')
    : courseData.courses.map((c) => `<option value="${c.id}">${c.code} · ${c.title}</option>`).join('');

  const courseLookup = Object.fromEntries(courseData.courses.map((c) => [c.id, c]));
  allMaterialsFlat = Object.entries(materialsData).flatMap(([courseId, items]) =>
    items.map((m) => ({ ...m, courseId, courseCode: courseLookup[courseId]?.code }))
  );
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
  let selectedFiles = [];

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

  uploadStartBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    const courseId = document.getElementById('upload-course-select').value;
    const useBackend = backendCourses.some((c) => String(c.id) === String(courseId));

    selectStep.style.display = 'none';
    processingStep.classList.add('is-active');

    const listEl = document.getElementById('processing-files-list');
    listEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="list-item-card" style="padding:14px 16px; margin-bottom:8px;" id="proc-file-${i}">
        <div>
          <div class="list-item-title" style="font-size:13.5px;">${f.name}</div>
          <div class="list-item-meta" id="proc-status-${i}">Uploading…</div>
        </div>
        <span id="proc-icon-${i}">⟳</span>
      </div>
    `).join('');

    if (!useBackend) {
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
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      const statusEl = document.getElementById(`proc-status-${i}`);
      const iconEl = document.getElementById(`proc-icon-${i}`);
      try {
        const formData = new FormData();
        formData.append('course_id', courseId);
        formData.append('file', f);
        const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        await res.json();
        statusEl.textContent = 'Ready';
        iconEl.textContent = '✓';
      } catch (err) {
        console.warn('Sabilearn: material upload failed.', err);
        statusEl.textContent = "We couldn't process this material";
        statusEl.style.color = 'var(--color-warn-text)';
        iconEl.innerHTML = `<button class="btn btn-secondary btn-sm" data-retry="${i}">Retry</button>`;
      }
    }
    doneBtn.style.display = 'inline-flex';
  });

  doneBtn.addEventListener('click', closeModal);
}
