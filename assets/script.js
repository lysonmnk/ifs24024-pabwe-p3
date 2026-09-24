/**
 * Konstanta kelas CSS terpusat untuk state dinamis UI
 * Mencegah duplikasi string className dan menjaga sinkronisasi dengan markup HTML
 */
const UI_CLASSES = {
  TAB: {
    ACTIVE: ['bg-white', 'text-indigo-700', 'shadow-sm', 'border-slate-200', 'font-bold'],
    INACTIVE: ['text-slate-700', 'hover:text-slate-900', 'hover:bg-slate-200/60', 'font-semibold', 'border-transparent'],
  },
  QUIZ_OPTION: {
    BASE: ['quiz-option-btn', 'w-full', 'p-4', 'text-left', 'rounded-2xl', 'font-bold', 'text-sm', 'transition', 'duration-150', 'flex', 'items-center', 'justify-between', 'group'],
    INTERACTIVE: ['border', 'border-slate-300', 'bg-slate-50', 'text-slate-900', 'hover:bg-indigo-100', 'hover:border-indigo-400', 'cursor-pointer'],
    CORRECT: ['border-2', 'border-emerald-700', 'bg-emerald-100', 'text-emerald-950', 'font-bold'],
    INCORRECT: ['border-2', 'border-rose-700', 'bg-rose-100', 'text-rose-950', 'font-bold'],
    MUTED: ['opacity-60'],
  },
  QUIZ_FEEDBACK: {
    BASE: ['p-4', 'rounded-2xl', 'border', 'transition-all'],
    CORRECT_BANNER: ['border-emerald-300', 'bg-emerald-100', 'text-emerald-950'],
    INCORRECT_BANNER: ['border-rose-300', 'bg-rose-100', 'text-rose-950'],
    CORRECT_ICON: ['ti-circle-check', 'text-emerald-800'],
    INCORRECT_ICON: ['ti-alert-circle', 'text-rose-800'],
  },
  QUIZ_ICON: {
    CORRECT: ['ti-check', 'text-emerald-800', 'opacity-100'],
    INCORRECT: ['ti-x', 'text-rose-800', 'opacity-100'],
  },
  BALANCE: {
    NEGATIVE: 'text-rose-800',
    POSITIVE: 'text-emerald-800',
    ZERO: 'text-slate-900',
  }
};

// =============================================================================
// 3. FORM VALIDATION HELPERS (DRY & REUSABLE FIELD CONFIGURATION)
// =============================================================================

/**
 * Kumpulan aturan validasi modular
 */
const ValidationRules = {
  required: (message = 'Field ini wajib diisi.') => ({
    test: (val) => String(val ?? '').trim().length > 0,
    message,
  }),
  positiveNumber: (message = 'Nominal harus berupa angka lebih besar dari 0.') => ({
    test: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && String(val ?? '').trim() !== '';
    },
    message,
  }),
  httpUrl: (message = 'URL harus diawali dengan http:// atau https:// dan memiliki format yang valid.') => ({
    test: (val) => isValidHttpUrl(String(val ?? '').trim()),
    message,
  }),
  validDate: (message = 'Tanggal transaksi wajib dipilih.') => ({
    test: (val) => String(val ?? '').trim().length > 0,
    message,
  }),
};

/**
 * Helper validasi form generik berbasis konfigurasi field (Menghilangkan duplikasi kode)
 * @param {Array<{ value: *, errorEl?: HTMLElement, rules: Array<{ test: Function, message: string }> }>} fieldConfigs
 * @returns {boolean} True jika semua field lolos validasi
 */
function validateFormFields(fieldConfigs) {
  let isAllValid = true;

  fieldConfigs.forEach(({ value, errorEl, rules }) => {
    let errorMessage = '';

    for (const rule of rules) {
      if (!rule.test(value)) {
        errorMessage = rule.message;
        break;
      }
    }

    if (errorEl) {
      if (errorMessage) {
        errorEl.textContent = errorMessage;
        errorEl.classList.remove('hidden');
      } else {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }

    if (errorMessage) {
      isAllValid = false;
    }
  });

  return isAllValid;
}

/**
 * Validasi bersama untuk input Expense Tracker (dipakai pada Tambah & Ubah)
 * @param {{ title: *, amount: *, date: * }} data
 * @param {{ title?: HTMLElement, amount?: HTMLElement, date?: HTMLElement }} errorEls
 * @returns {boolean}
 */
function validateExpenseInputs(data, errorEls = {}) {
  return validateFormFields([
    {
      value: data.title,
      errorEl: errorEls.title,
      rules: [ValidationRules.required('Judul transaksi wajib diisi.')],
    },
    {
      value: data.amount,
      errorEl: errorEls.amount,
      rules: [ValidationRules.positiveNumber('Nominal harus berupa angka lebih besar dari 0.')],
    },
    {
      value: data.date,
      errorEl: errorEls.date,
      rules: [ValidationRules.validDate('Tanggal transaksi wajib dipilih.')],
    },
  ]);
}

/**
 * Validasi bersama untuk input Bookmark Manager (dipakai pada Tambah & Ubah)
 * @param {{ title: *, url: * }} data
 * @param {{ title?: HTMLElement, url?: HTMLElement }} errorEls
 * @returns {boolean}
 */
function validateBookmarkInputs(data, errorEls = {}) {
  return validateFormFields([
    {
      value: data.title,
      errorEl: errorEls.title,
      rules: [ValidationRules.required('Judul bookmark wajib diisi.')],
    },
    {
      value: data.url,
      errorEl: errorEls.url,
      rules: [
        ValidationRules.required('URL website wajib diisi.'),
        ValidationRules.httpUrl('URL harus diawali dengan http:// atau https:// dan memiliki format yang valid.'),
      ],
    },
  ]);
}

// =============================================================================
// 4. TAB ROUTER (QUERY STRING MANAGEMENT & WAI-ARIA DENGAN CLASSLIST.TOGGLE)
// =============================================================================

const STORAGE_KEYS = {
  EXPENSE: 'expense_tracker_data',
  BOOKMARK: 'bookmark_manager_data',
  QUIZ_HIGHSCORE: 'quiz_app_highscore',
};

const VALID_TABS = ['expense', 'bookmark', 'quiz'];
const DEFAULT_TAB = 'expense';

/**
 * Membaca tab aktif saat ini dari Query String URL (?tab=...)
 * @returns {string}
 */
function getActiveTabFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam && VALID_TABS.includes(tabParam.toLowerCase())) {
    return tabParam.toLowerCase();
  }
  return DEFAULT_TAB;
}

/**
 * Mengganti tab aktif menggunakan classList.toggle terpusat dan update URL tanpa reload
 * @param {string} targetTab 
 * @param {boolean} [pushHistory=false] 
 */
function switchTab(targetTab, pushHistory = false) {
  const safeTab = VALID_TABS.includes(targetTab) ? targetTab : DEFAULT_TAB;

  // Sembunyikan semua panel
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  // Tampilkan panel yang dipilih
  const activePanel = document.getElementById(`panel-${safeTab}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }

  // Update styling tombol tab menggunakan classList.toggle dari konstanta UI_CLASSES.TAB
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const tabName = btn.dataset.tab;
    const isCurrent = tabName === safeTab;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');

    UI_CLASSES.TAB.ACTIVE.forEach(cls => btn.classList.toggle(cls, isCurrent));
    UI_CLASSES.TAB.INACTIVE.forEach(cls => btn.classList.toggle(cls, !isCurrent));
  });

  // Sinkronisasi query string di URL
  const currentParams = new URLSearchParams(window.location.search);
  if (currentParams.get('tab') !== safeTab) {
    currentParams.set('tab', safeTab);
    const newRelativeUrl = `${window.location.pathname}?${currentParams.toString()}`;
    if (pushHistory) {
      window.history.pushState({ tab: safeTab }, '', newRelativeUrl);
    } else {
      window.history.replaceState({ tab: safeTab }, '', newRelativeUrl);
    }
  }

  // Hook re-render saat membuka tab tertentu
  if (safeTab === 'expense') {
    renderExpenses();
  } else if (safeTab === 'bookmark') {
    renderBookmarks();
  } else if (safeTab === 'quiz') {
    updateQuizHighScoreDisplay();
  }
}

// =============================================================================
// 5. GLOBAL MODAL CONFIRMATION DIALOG (REUSABLE)
// =============================================================================

let onConfirmDeleteCallback = null;

const modalConfirmDelete = document.getElementById('modal-confirm-delete');
const confirmDeleteTitle = document.getElementById('confirm-delete-title');
const confirmDeleteMessage = document.getElementById('confirm-delete-message');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnProceedDelete = document.getElementById('btn-proceed-delete');

/**
 * Menampilkan modal konfirmasi hapus data
 * @param {string} title 
 * @param {string} message 
 * @param {Function} onConfirm 
 */
function showDeleteConfirmation(title, message, onConfirm) {
  confirmDeleteTitle.textContent = title;
  confirmDeleteMessage.textContent = message;
  onConfirmDeleteCallback = onConfirm;
  modalConfirmDelete.classList.remove('hidden');
  modalConfirmDelete.classList.add('flex');
}

/**
 * Menutup modal konfirmasi hapus
 */
function hideDeleteConfirmation() {
  modalConfirmDelete.classList.add('hidden');
  modalConfirmDelete.classList.remove('flex');
  onConfirmDeleteCallback = null;
}

// =============================================================================
// 6. EXPENSE TRACKER FEATURE
// =============================================================================

/**
 * Data contoh bawaan (Seed/Demo Data)
 * Diberikan penanda '[Contoh]' yang jelas agar tidak dianggap sebagai data transaksi pengguna nyata.
 */
const DEFAULT_EXPENSES = [
  {
    id: 'demo-exp-1',
    title: '[Contoh] Gaji Bulanan',
    category: 'Gaji',
    amount: 5000000,
    type: 'income',
    date: getTodayDateString(),
    isDemoData: true,
  },
  {
    id: 'demo-exp-2',
    title: '[Contoh] Belanja Mingguan',
    category: 'Belanja',
    amount: 350000,
    type: 'expense',
    date: getTodayDateString(),
    isDemoData: true,
  }
];

let expenses = getStorage(STORAGE_KEYS.EXPENSE, DEFAULT_EXPENSES);

// Elemen DOM Expense Tracker
const expenseForm = document.getElementById('expense-form');
const expenseInputTitle = document.getElementById('expense-input-title');
const expenseInputAmount = document.getElementById('expense-input-amount');
const expenseInputCategory = document.getElementById('expense-input-category');
const expenseInputDate = document.getElementById('expense-input-date');
const expenseErrorTitle = document.getElementById('expense-error-title');
const expenseErrorAmount = document.getElementById('expense-error-amount');
const expenseErrorDate = document.getElementById('expense-error-date');

const expenseBalanceDisplay = document.getElementById('expense-balance');
const expenseTotalIncomeDisplay = document.getElementById('expense-total-income');
const expenseTotalExpenseDisplay = document.getElementById('expense-total-expense');

const expenseSearchInput = document.getElementById('expense-search');
const expenseFilterType = document.getElementById('expense-filter-type');
const expenseSortBy = document.getElementById('expense-sort-by');
const expenseListContainer = document.getElementById('expense-list-container');
const expenseEmptyState = document.getElementById('expense-empty-state');
const expenseCounter = document.getElementById('expense-counter');

// Modal Edit Expense
const modalEditExpense = document.getElementById('modal-edit-expense');
const formEditExpense = document.getElementById('form-edit-expense');
const editExpenseId = document.getElementById('edit-expense-id');
const editExpenseTitle = document.getElementById('edit-expense-title');
const editExpenseAmount = document.getElementById('edit-expense-amount');
const editExpenseCategory = document.getElementById('edit-expense-category');
const editExpenseDate = document.getElementById('edit-expense-date');
const editExpenseErrorTitle = document.getElementById('edit-expense-error-title');
const editExpenseErrorAmount = document.getElementById('edit-expense-error-amount');
const editExpenseErrorDate = document.getElementById('edit-expense-error-date');
const modalCloseEditExpense = document.getElementById('modal-close-edit-expense');
const modalCancelEditExpense = document.getElementById('modal-cancel-edit-expense');

/**
 * Menghitung dan memperbarui kartu ringkasan (Summary Cards)
 */
function updateExpenseSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  expenses.forEach(item => {
    const val = Number(item.amount) || 0;
    if (item.type === 'income') {
      totalIncome += val;
    } else {
      totalExpense += val;
    }
  });

  const balance = totalIncome - totalExpense;

  expenseTotalIncomeDisplay.textContent = formatRupiah(totalIncome);
  expenseTotalExpenseDisplay.textContent = formatRupiah(totalExpense);
  expenseBalanceDisplay.textContent = formatRupiah(balance);

  // Pewarnaan saldo dinamis menggunakan classList dan konstanta UI_CLASSES.BALANCE
  expenseBalanceDisplay.classList.remove(UI_CLASSES.BALANCE.NEGATIVE, UI_CLASSES.BALANCE.POSITIVE, UI_CLASSES.BALANCE.ZERO);
  if (balance < 0) {
    expenseBalanceDisplay.classList.add(UI_CLASSES.BALANCE.NEGATIVE);
  } else if (balance > 0) {
    expenseBalanceDisplay.classList.add(UI_CLASSES.BALANCE.POSITIVE);
  } else {
    expenseBalanceDisplay.classList.add(UI_CLASSES.BALANCE.ZERO);
  }
}

/**
 * Menyaring dan mengurutkan daftar transaksi sesuai filter & search
 * @returns {Array}
 */
function getFilteredAndSortedExpenses() {
  const searchQuery = (expenseSearchInput.value || '').trim().toLowerCase();
  const filterType = expenseFilterType.value;
  const sortBy = expenseSortBy.value;

  // 1. Filter
  let result = expenses.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) {
      return false;
    }
    if (searchQuery) {
      const matchTitle = (item.title || '').toLowerCase().includes(searchQuery);
      const matchCat = (item.category || '').toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchCat) return false;
    }
    return true;
  });

  // 2. Sort
  result.sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'amount-asc':
        return a.amount - b.amount;
      case 'amount-desc':
        return b.amount - a.amount;
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  return result;
}

/**
 * Merender daftar transaksi ke DOM dengan kontras warna WCAG AA
 */
function renderExpenses() {
  updateExpenseSummary();
  const list = getFilteredAndSortedExpenses();

  expenseCounter.textContent = `${list.length} dari ${expenses.length} transaksi`;
  expenseListContainer.innerHTML = '';

  if (list.length === 0) {
    expenseEmptyState.classList.remove('hidden');
    return;
  }

  expenseEmptyState.classList.add('hidden');

  list.forEach(item => {
    const isIncome = item.type === 'income';
    const row = document.createElement('div');
    row.classList.add('p-4', 'sm:p-5', 'flex', 'items-center', 'justify-between', 'hover:bg-slate-50', 'transition-colors', 'gap-3');

    const iconBg = isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
    const iconClass = isIncome ? 'ti-arrow-up-right' : 'ti-arrow-down-left';
    const amountColor = isIncome ? 'text-emerald-800' : 'text-rose-800';
    const prefixSign = isIncome ? '+ ' : '- ';

    row.innerHTML = `
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 text-xl font-bold">
          <i class="ti ${iconClass}" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <h5 class="text-sm sm:text-base font-bold text-slate-900 truncate">${escapeHtml(item.title)}</h5>
          <div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-700 font-semibold">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-xs">${escapeHtml(item.category)}</span>
            <span aria-hidden="true">&bull;</span>
            <span class="flex items-center"><i class="ti ti-calendar mr-1 text-slate-600" aria-hidden="true"></i>${formatDateIndo(item.date)}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        <div class="text-right">
          <div class="text-sm sm:text-base font-extrabold ${amountColor} tracking-tight">${prefixSign}${formatRupiah(item.amount)}</div>
          <span class="text-xs uppercase font-bold text-slate-700 tracking-wider">${isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" 
                  data-action="edit-expense" 
                  data-id="${item.id}" 
                  class="p-2 text-slate-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors" 
                  title="Ubah Transaksi ${escapeHtml(item.title)}"
                  aria-label="Ubah Transaksi ${escapeHtml(item.title)}">
            <i class="ti ti-edit text-base pointer-events-none" aria-hidden="true"></i>
          </button>
          <button type="button" 
                  data-action="delete-expense" 
                  data-id="${item.id}" 
                  class="p-2 text-slate-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors" 
                  title="Hapus Transaksi ${escapeHtml(item.title)}"
                  aria-label="Hapus Transaksi ${escapeHtml(item.title)}">
            <i class="ti ti-trash text-base pointer-events-none" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    expenseListContainer.appendChild(row);
  });
}

/**
 * Handle submit tambah transaksi baru (Menggunakan helper validasi bersama)
 * @param {Event} e 
 */
function handleAddExpense(e) {
  e.preventDefault();

  const title = expenseInputTitle.value;
  const amount = expenseInputAmount.value;
  const date = expenseInputDate.value;

  const isValid = validateExpenseInputs(
    { title, amount, date },
    {
      title: expenseErrorTitle,
      amount: expenseErrorAmount,
      date: expenseErrorDate,
    }
  );

  if (!isValid) return;

  const selectedTypeEl = document.querySelector('input[name="expense-type"]:checked');
  const type = selectedTypeEl ? selectedTypeEl.value : 'income';

  const newExpense = {
    id: 'e-' + Date.now(),
    title: title.trim(),
    category: expenseInputCategory.value,
    amount: Number(amount),
    type: type,
    date: date,
  };

  expenses.unshift(newExpense);
  setStorage(STORAGE_KEYS.EXPENSE, expenses);

  // Reset form
  expenseInputTitle.value = '';
  expenseInputAmount.value = '';
  expenseInputDate.value = getTodayDateString();
  const defaultRadio = document.querySelector('input[name="expense-type"][value="income"]');
  if (defaultRadio) defaultRadio.checked = true;

  renderExpenses();
}

/**
 * Membuka modal edit transaksi
 * @param {string} id 
 */
function openEditExpenseModal(id) {
  const item = expenses.find(x => x.id === id);
  if (!item) return;

  editExpenseId.value = item.id;
  editExpenseTitle.value = item.title;
  editExpenseAmount.value = item.amount;
  editExpenseCategory.value = item.category;
  editExpenseDate.value = item.date;

  const typeRadio = document.querySelector(`input[name="edit-expense-type"][value="${item.type}"]`);
  if (typeRadio) typeRadio.checked = true;

  editExpenseErrorTitle.classList.add('hidden');
  editExpenseErrorAmount.classList.add('hidden');
  editExpenseErrorDate.classList.add('hidden');

  modalEditExpense.classList.remove('hidden');
  modalEditExpense.classList.add('flex');
}

/**
 * Menutup modal edit transaksi
 */
function closeEditExpenseModal() {
  modalEditExpense.classList.add('hidden');
  modalEditExpense.classList.remove('flex');
}

/**
 * Handle submit simpan hasil edit transaksi (Menggunakan helper validasi bersama)
 * @param {Event} e 
 */
function handleSaveEditExpense(e) {
  e.preventDefault();

  const id = editExpenseId.value;
  const title = editExpenseTitle.value;
  const amount = editExpenseAmount.value;
  const date = editExpenseDate.value;
  const category = editExpenseCategory.value;
  const selectedTypeEl = document.querySelector('input[name="edit-expense-type"]:checked');
  const type = selectedTypeEl ? selectedTypeEl.value : 'income';

  const isValid = validateExpenseInputs(
    { title, amount, date },
    {
      title: editExpenseErrorTitle,
      amount: editExpenseErrorAmount,
      date: editExpenseErrorDate,
    }
  );

  if (!isValid) return;

  const index = expenses.findIndex(x => x.id === id);
  if (index !== -1) {
    expenses[index] = {
      ...expenses[index],
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      type
    };
    setStorage(STORAGE_KEYS.EXPENSE, expenses);
    renderExpenses();
    closeEditExpenseModal();
  }
}

/**
 * Menghapus transaksi berdasarkan ID dengan konfirmasi
 * @param {string} id 
 */
function promptDeleteExpense(id) {
  const item = expenses.find(x => x.id === id);
  if (!item) return;

  showDeleteConfirmation(
    'Hapus Transaksi',
    `Apakah Anda yakin ingin menghapus transaksi "${item.title}" senilai ${formatRupiah(item.amount)}?`,
    () => {
      expenses = expenses.filter(x => x.id !== id);
      setStorage(STORAGE_KEYS.EXPENSE, expenses);
      renderExpenses();
      hideDeleteConfirmation();
    }
  );
}

/**
 * Opsi reset data transaksi pengguna ke daftar kosong
 */
function promptResetExpenses() {
  showDeleteConfirmation(
    'Kosongkan Semua Transaksi',
    'Apakah Anda yakin ingin mengosongkan semua data transaksi dan memulai dari daftar kosong?',
    () => {
      expenses = [];
      setStorage(STORAGE_KEYS.EXPENSE, expenses);
      renderExpenses();
      hideDeleteConfirmation();
    }
  );
}

// =============================================================================
// 7. BOOKMARK MANAGER FEATURE
// =============================================================================

/**
 * Data contoh bawaan (Seed/Demo Data)
 * Diberikan penanda '[Contoh]' yang jelas agar tidak dianggap sebagai data bookmark pengguna nyata.
 */
const DEFAULT_BOOKMARKS = [
  {
    id: 'demo-bm-1',
    title: '[Contoh] MDN Web Docs',
    url: 'https://developer.mozilla.org',
    category: 'Dokumentasi',
    note: 'Data contoh referensi dokumentasi Web dan JavaScript',
    createdAt: Date.now() - 7200000,
    isDemoData: true,
  },
  {
    id: 'demo-bm-2',
    title: '[Contoh] Tailwind CSS Documentation',
    url: 'https://tailwindcss.com/docs',
    category: 'Desain',
    note: 'Data contoh katalog utility class Tailwind CSS',
    createdAt: Date.now() - 3600000,
    isDemoData: true,
  }
];

let bookmarks = getStorage(STORAGE_KEYS.BOOKMARK, DEFAULT_BOOKMARKS);

// Elemen DOM Bookmark
const bookmarkForm = document.getElementById('bookmark-form');
const bookmarkInputTitle = document.getElementById('bookmark-input-title');
const bookmarkInputUrl = document.getElementById('bookmark-input-url');
const bookmarkInputCategory = document.getElementById('bookmark-input-category');
const bookmarkInputNote = document.getElementById('bookmark-input-note');
const bookmarkErrorTitle = document.getElementById('bookmark-error-title');
const bookmarkErrorUrl = document.getElementById('bookmark-error-url');

const bookmarkSearchInput = document.getElementById('bookmark-search');
const bookmarkSortBy = document.getElementById('bookmark-sort-by');
const bookmarkGridContainer = document.getElementById('bookmark-grid-container');
const bookmarkEmptyState = document.getElementById('bookmark-empty-state');
const bookmarkCounter = document.getElementById('bookmark-counter');

// Modal Edit Bookmark
const modalEditBookmark = document.getElementById('modal-edit-bookmark');
const formEditBookmark = document.getElementById('form-edit-bookmark');
const editBookmarkId = document.getElementById('edit-bookmark-id');
const editBookmarkTitle = document.getElementById('edit-bookmark-title');
const editBookmarkUrl = document.getElementById('edit-bookmark-url');
const editBookmarkCategory = document.getElementById('edit-bookmark-category');
const editBookmarkNote = document.getElementById('edit-bookmark-note');
const editBookmarkErrorTitle = document.getElementById('edit-bookmark-error-title');
const editBookmarkErrorUrl = document.getElementById('edit-bookmark-error-url');
const modalCloseEditBookmark = document.getElementById('modal-close-edit-bookmark');
const modalCancelEditBookmark = document.getElementById('modal-cancel-edit-bookmark');

/**
 * Filter dan sorting bookmark
 * @returns {Array}
 */
function getFilteredAndSortedBookmarks() {
  const searchQuery = (bookmarkSearchInput.value || '').trim().toLowerCase();
  const sortBy = bookmarkSortBy.value;

  // 1. Filter pencarian
  let result = bookmarks.filter(item => {
    if (!searchQuery) return true;
    const matchTitle = (item.title || '').toLowerCase().includes(searchQuery);
    const matchCat = (item.category || '').toLowerCase().includes(searchQuery);
    const matchUrl = (item.url || '').toLowerCase().includes(searchQuery);
    const matchNote = (item.note || '').toLowerCase().includes(searchQuery);
    return matchTitle || matchCat || matchUrl || matchNote;
  });

  // 2. Sorting
  result.sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'created-asc':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'created-desc':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  return result;
}

/**
 * Merender daftar kartu bookmark ke DOM dengan kontras warna tinggi
 */
function renderBookmarks() {
  const list = getFilteredAndSortedBookmarks();
  bookmarkCounter.textContent = `${list.length} dari ${bookmarks.length} tautan`;
  bookmarkGridContainer.innerHTML = '';

  if (list.length === 0) {
    bookmarkEmptyState.classList.remove('hidden');
    return;
  }

  bookmarkEmptyState.classList.add('hidden');

  list.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('bg-white', 'rounded-2xl', 'p-5', 'border', 'border-slate-200', 'shadow-sm', 'hover:shadow-md', 'transition', 'duration-200', 'flex', 'flex-col', 'justify-between');

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
              <i class="ti ti-bookmark text-lg" aria-hidden="true"></i>
            </div>
            <div class="min-w-0">
              <h5 class="text-sm font-bold text-slate-900 truncate" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h5>
              <span class="inline-block text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md mt-0.5">${escapeHtml(item.category)}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" 
                    data-action="edit-bookmark" 
                    data-id="${item.id}" 
                    class="p-1.5 text-slate-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors" 
                    title="Ubah Bookmark ${escapeHtml(item.title)}"
                    aria-label="Ubah Bookmark ${escapeHtml(item.title)}">
              <i class="ti ti-edit text-base pointer-events-none" aria-hidden="true"></i>
            </button>
            <button type="button" 
                    data-action="delete-bookmark" 
                    data-id="${item.id}" 
                    class="p-1.5 text-slate-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors" 
                    title="Hapus Bookmark ${escapeHtml(item.title)}"
                    aria-label="Hapus Bookmark ${escapeHtml(item.title)}">
              <i class="ti ti-trash text-base pointer-events-none" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- URL Preview -->
        <div class="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 overflow-hidden">
          <i class="ti ti-link text-xs text-slate-600 shrink-0" aria-hidden="true"></i>
          <span class="text-xs text-slate-800 font-mono font-medium truncate">${escapeHtml(item.url)}</span>
        </div>

        <!-- Catatan -->
        ${item.note ? `<p class="text-xs text-slate-700 line-clamp-2 italic">"${escapeHtml(item.note)}"</p>` : ''}
      </div>

      <!-- Action Button: Open in new tab securely -->
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-700 font-semibold">Tersimpan</span>
        <a href="${escapeHtml(item.url)}" 
           target="_blank" 
           rel="noopener noreferrer" 
           aria-label="Kunjungi website ${escapeHtml(item.title)} di tab baru"
           class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
          <span>Kunjungi</span>
          <i class="ti ti-external-link text-sm" aria-hidden="true"></i>
        </a>
      </div>
    `;

    bookmarkGridContainer.appendChild(card);
  });
}

/**
 * Handle submit tambah bookmark baru (Menggunakan helper validasi bersama)
 * @param {Event} e 
 */
function handleAddBookmark(e) {
  e.preventDefault();

  const title = bookmarkInputTitle.value;
  const url = bookmarkInputUrl.value;

  const isValid = validateBookmarkInputs(
    { title, url },
    {
      title: bookmarkErrorTitle,
      url: bookmarkErrorUrl,
    }
  );

  if (!isValid) return;

  const newBookmark = {
    id: 'b-' + Date.now(),
    title: title.trim(),
    url: url.trim(),
    category: bookmarkInputCategory.value,
    note: bookmarkInputNote.value.trim(),
    createdAt: Date.now()
  };

  bookmarks.unshift(newBookmark);
  setStorage(STORAGE_KEYS.BOOKMARK, bookmarks);

  // Reset form
  bookmarkInputTitle.value = '';
  bookmarkInputUrl.value = '';
  bookmarkInputNote.value = '';

  renderBookmarks();
}

/**
 * Membuka modal edit bookmark
 * @param {string} id 
 */
function openEditBookmarkModal(id) {
  const item = bookmarks.find(x => x.id === id);
  if (!item) return;

  editBookmarkId.value = item.id;
  editBookmarkTitle.value = item.title;
  editBookmarkUrl.value = item.url;
  editBookmarkCategory.value = item.category;
  editBookmarkNote.value = item.note || '';

  editBookmarkErrorTitle.classList.add('hidden');
  editBookmarkErrorUrl.classList.add('hidden');

  modalEditBookmark.classList.remove('hidden');
  modalEditBookmark.classList.add('flex');
}

/**
 * Menutup modal edit bookmark
 */
function closeEditBookmarkModal() {
  modalEditBookmark.classList.add('hidden');
  modalEditBookmark.classList.remove('flex');
}

/**
 * Handle submit simpan perubahan bookmark (Menggunakan helper validasi bersama)
 * @param {Event} e 
 */
function handleSaveEditBookmark(e) {
  e.preventDefault();

  const id = editBookmarkId.value;
  const title = editBookmarkTitle.value;
  const url = editBookmarkUrl.value;
  const category = editBookmarkCategory.value;
  const note = editBookmarkNote.value.trim();

  const isValid = validateBookmarkInputs(
    { title, url },
    {
      title: editBookmarkErrorTitle,
      url: editBookmarkErrorUrl,
    }
  );

  if (!isValid) return;

  const index = bookmarks.findIndex(x => x.id === id);
  if (index !== -1) {
    bookmarks[index] = {
      ...bookmarks[index],
      title: title.trim(),
      url: url.trim(),
      category,
      note
    };
    setStorage(STORAGE_KEYS.BOOKMARK, bookmarks);
    renderBookmarks();
    closeEditBookmarkModal();
  }
}

/**
 * Menghapus bookmark dengan modal konfirmasi
 * @param {string} id 
 */
function promptDeleteBookmark(id) {
  const item = bookmarks.find(x => x.id === id);
  if (!item) return;

  showDeleteConfirmation(
    'Hapus Bookmark',
    `Apakah Anda yakin ingin menghapus bookmark "${item.title}"?`,
    () => {
      bookmarks = bookmarks.filter(x => x.id !== id);
      setStorage(STORAGE_KEYS.BOOKMARK, bookmarks);
      renderBookmarks();
      hideDeleteConfirmation();
    }
  );
}

/**
 * Opsi reset data bookmark pengguna ke daftar kosong
 */
function promptResetBookmarks() {
  showDeleteConfirmation(
    'Kosongkan Semua Bookmark',
    'Apakah Anda yakin ingin mengosongkan semua bookmark dan memulai dari daftar kosong?',
    () => {
      bookmarks = [];
      setStorage(STORAGE_KEYS.BOOKMARK, bookmarks);
      renderBookmarks();
      hideDeleteConfirmation();
    }
  );
}

// =============================================================================
// 8. QUIZ APP FEATURE (DYNAMIC SCORING BERBASIS SKALA 100)
// =============================================================================

/**
 * Koleksi Pertanyaan Kuis (Minimal 5 soal array of object)
 */
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Apa kepanjangan dari singkatan DOM dalam pemrograman web?',
    options: [
      'Document Object Model',
      'Data Object Management',
      'Digital Ordering Method',
      'Document Order Management'
    ],
    answer: 0,
    explanation: 'DOM adalah singkatan dari Document Object Model, representasi pohon dokumen web yang dapat diakses dan diubah oleh JavaScript.'
  },
  {
    id: 2,
    question: 'Metode mana yang digunakan untuk mendaftarkan event listener pada sebuah elemen DOM tanpa inline JavaScript?',
    options: [
      'element.attachEvent()',
      'element.addEventListener()',
      'element.listen()',
      'element.setEventListener()'
    ],
    answer: 1,
    explanation: 'Standar W3C modern menggunakan element.addEventListener(type, listener) untuk memasang event handler secara modular.'
  },
  {
    id: 3,
    question: 'Di manakah data yang disimpan pada Web Storage API (localStorage) berada?',
    options: [
      'Di server basis data PostgreSQL',
      'Di cookies sementara yang hilang saat refresh',
      'Di sisi klien (browser) dan bertahan meskipun browser ditutup',
      'Di memori RAM server web'
    ],
    answer: 2,
    explanation: 'localStorage menyimpan pasangan key-value secara persisten di browser pengguna tanpa batas kedaluwarsa otomatis.'
  },
  {
    id: 4,
    question: 'Method array manakah yang digunakan untuk menyaring elemen berdasarkan kondisi dan mengembalikan array baru?',
    options: [
      'Array.prototype.find()',
      'Array.prototype.map()',
      'Array.prototype.forEach()',
      'Array.prototype.filter()'
    ],
    answer: 3,
    explanation: 'Array.prototype.filter() mengembalikan array baru berisi seluruh elemen yang lolos kondisi logika callback.'
  },
  {
    id: 5,
    question: 'Apa perbedaan utama antara variabel yang dideklarasikan dengan `const` dan `let`?',
    options: [
      'const memiliki function scope, sedangkan let memiliki block scope',
      'const tidak dapat di-reassign (diberi nilai ulang), sedangkan let dapat di-reassign',
      'let hanya untuk angka, sedangkan const untuk string',
      'const otomatis disimpan ke localStorage, let tidak'
    ],
    answer: 1,
    explanation: 'Keduanya ber-block scope, namun binding variabel const tidak dapat di-reassign setelah inisialisasi awal.'
  },
  {
    id: 6,
    question: 'Bagaimana cara mengubah objek JavaScript menjadi format string JSON sebelum disimpan ke localStorage?',
    options: [
      'JSON.parse(object)',
      'JSON.stringify(object)',
      'object.toJSONString()',
      'JSON.encode(object)'
    ],
    answer: 1,
    explanation: 'JSON.stringify() mengonversi nilai JavaScript menjadi representasi JSON string untuk disimpan ke media penyimpanan teks.'
  }
];

// State Quiz Dinamis
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let quizScore = 0;
let isAnswerSubmitted = false;

// Elemen DOM Quiz
const quizScreenStart = document.getElementById('quiz-screen-start');
const quizScreenQuestion = document.getElementById('quiz-screen-question');
const quizScreenResult = document.getElementById('quiz-screen-result');

const quizTotalQuestionsStart = document.getElementById('quiz-total-questions-start');
const quizHighscoreDisplay = document.getElementById('quiz-highscore-display');
const quizBtnStart = document.getElementById('quiz-btn-start');

const quizQuestionNumber = document.getElementById('quiz-question-number');
const quizCurrentScoreTag = document.getElementById('quiz-current-score-tag');
const quizProgressBar = document.getElementById('quiz-progress-bar');
const quizQuestionText = document.getElementById('quiz-question-text');
const quizOptionsContainer = document.getElementById('quiz-options-container');

const quizFeedbackBanner = document.getElementById('quiz-feedback-banner');
const quizFeedbackIcon = document.getElementById('quiz-feedback-icon');
const quizFeedbackTitle = document.getElementById('quiz-feedback-title');
const quizFeedbackMessage = document.getElementById('quiz-feedback-message');
const quizBtnNext = document.getElementById('quiz-btn-next');

const quizFinalScore = document.getElementById('quiz-final-score');
const quizScorePercentage = document.getElementById('quiz-score-percentage');
const quizNewHighscoreBadge = document.getElementById('quiz-new-highscore-badge');
const quizBtnRestart = document.getElementById('quiz-btn-restart');

/**
 * Menghitung bobot poin per soal secara dinamis berdasarkan total skala 100
 * @returns {number}
 */
function getDynamicPointsPerQuestion() {
  const total = QUIZ_QUESTIONS.length;
  if (total <= 0) return 0;
  return Math.round((100 / total) * 100) / 100;
}

/**
 * Membaca dan menampilkan skor tertinggi (Highscore) dari localStorage
 */
function updateQuizHighScoreDisplay() {
  const currentHighScore = Number(localStorage.getItem(STORAGE_KEYS.QUIZ_HIGHSCORE)) || 0;
  if (quizHighscoreDisplay) {
    quizHighscoreDisplay.textContent = `${currentHighScore} Poin`;
  }
}

/**
 * Memulai kuis dari awal
 */
function startQuiz() {
  currentQuestionIndex = 0;
  correctAnswersCount = 0;
  quizScore = 0;
  isAnswerSubmitted = false;

  quizScreenStart.classList.add('hidden');
  quizScreenResult.classList.add('hidden');
  quizScreenQuestion.classList.remove('hidden');

  renderCurrentQuestion();
}

/**
 * Merender pertanyaan aktif saat ini
 */
function renderCurrentQuestion() {
  const totalQuestions = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[currentQuestionIndex];
  isAnswerSubmitted = false;

  // Header info dinamis
  quizQuestionNumber.textContent = `Soal ${currentQuestionIndex + 1} dari ${totalQuestions}`;
  quizCurrentScoreTag.textContent = `Skor: ${quizScore}`;
  
  // Progress bar
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  quizProgressBar.style.width = `${progressPercent}%`;

  // Pertanyaan
  quizQuestionText.textContent = question.question;

  // Bersihkan opsi lama & feedback banner
  quizOptionsContainer.innerHTML = '';
  quizFeedbackBanner.classList.add('hidden');
  quizBtnNext.classList.add('hidden');

  // Render opsi pilihan ganda
  question.options.forEach((optText, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add(...UI_CLASSES.QUIZ_OPTION.BASE, ...UI_CLASSES.QUIZ_OPTION.INTERACTIVE);
    btn.dataset.index = index;

    btn.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="w-7 h-7 rounded-xl bg-white border border-slate-300 group-hover:border-indigo-600 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
          ${String.fromCharCode(65 + index)}
        </span>
        <span class="text-slate-900">${escapeHtml(optText)}</span>
      </div>
      <i class="quiz-option-icon ti text-lg opacity-0 transition-opacity" aria-hidden="true"></i>
    `;

    quizOptionsContainer.appendChild(btn);
  });
}

/**
 * Handle ketika pengguna memilih jawaban opsi menggunakan classList terpusat
 * @param {number} selectedIndex 
 */
function handleSelectAnswer(selectedIndex) {
  if (isAnswerSubmitted) return;
  isAnswerSubmitted = true;

  const currentQ = QUIZ_QUESTIONS[currentQuestionIndex];
  const isCorrect = selectedIndex === currentQ.answer;
  const totalQuestions = QUIZ_QUESTIONS.length;
  const pointsPerQuestion = getDynamicPointsPerQuestion();

  if (isCorrect) {
    correctAnswersCount++;
    // Perhitungan skor dinamis proporsional menuju skala 100
    quizScore = Math.min(100, Math.round((correctAnswersCount / totalQuestions) * 100));
  }

  quizCurrentScoreTag.textContent = `Skor: ${quizScore}`;

  // Berikan visual feedback menggunakan konstanta UI_CLASSES.QUIZ_OPTION
  const allOptionBtns = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
  allOptionBtns.forEach((btn) => {
    const idx = Number(btn.dataset.index);
    btn.disabled = true;
    UI_CLASSES.QUIZ_OPTION.INTERACTIVE.forEach(cls => btn.classList.remove(cls));
    btn.classList.add('cursor-default');

    const icon = btn.querySelector('.quiz-option-icon');

    if (idx === currentQ.answer) {
      // Jawaban benar (hijau kontras tinggi)
      btn.classList.remove('border-slate-300', 'bg-slate-50');
      UI_CLASSES.QUIZ_OPTION.CORRECT.forEach(cls => btn.classList.add(cls));
      if (icon) {
        icon.classList.remove('opacity-0');
        UI_CLASSES.QUIZ_ICON.CORRECT.forEach(cls => icon.classList.add(cls));
      }
    } else if (idx === selectedIndex && !isCorrect) {
      // Jawaban salah yang dipilih (merah kontras tinggi)
      btn.classList.remove('border-slate-300', 'bg-slate-50');
      UI_CLASSES.QUIZ_OPTION.INCORRECT.forEach(cls => btn.classList.add(cls));
      if (icon) {
        icon.classList.remove('opacity-0');
        UI_CLASSES.QUIZ_ICON.INCORRECT.forEach(cls => icon.classList.add(cls));
      }
    } else {
      UI_CLASSES.QUIZ_OPTION.MUTED.forEach(cls => btn.classList.add(cls));
    }
  });

  // Tampilkan feedback banner dengan nilai poin dinamis menggunakan konstanta UI_CLASSES.QUIZ_FEEDBACK
  quizFeedbackBanner.classList.remove('hidden');
  UI_CLASSES.QUIZ_FEEDBACK.BASE.forEach(cls => quizFeedbackBanner.classList.add(cls));
  UI_CLASSES.QUIZ_FEEDBACK.CORRECT_BANNER.forEach(cls => quizFeedbackBanner.classList.toggle(cls, isCorrect));
  UI_CLASSES.QUIZ_FEEDBACK.INCORRECT_BANNER.forEach(cls => quizFeedbackBanner.classList.toggle(cls, !isCorrect));

  quizFeedbackIcon.classList.remove('ti-circle-check', 'ti-alert-circle', 'text-emerald-800', 'text-rose-800');
  quizFeedbackIcon.classList.add('text-2xl', 'mt-0.5');
  if (isCorrect) {
    UI_CLASSES.QUIZ_FEEDBACK.CORRECT_ICON.forEach(cls => quizFeedbackIcon.classList.add(cls));
    quizFeedbackTitle.textContent = `Jawaban Benar! (+${Math.round(pointsPerQuestion)} Poin)`;
  } else {
    UI_CLASSES.QUIZ_FEEDBACK.INCORRECT_ICON.forEach(cls => quizFeedbackIcon.classList.add(cls));
    quizFeedbackTitle.textContent = 'Jawaban Kurang Tepat';
  }
  quizFeedbackMessage.textContent = currentQ.explanation;

  // Tampilkan tombol soal berikutnya
  quizBtnNext.classList.remove('hidden');
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
  quizBtnNext.querySelector('span').textContent = isLastQuestion ? 'Lihat Hasil Akhir' : 'Soal Berikutnya';
}

/**
 * Berpindah ke soal berikutnya atau ke layar hasil
 */
function handleNextQuestion() {
  if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  } else {
    showQuizResult();
  }
}

/**
 * Menampilkan layar skor akhir (skala dinamis 100) dan update highscore di localStorage
 */
function showQuizResult() {
  quizScreenQuestion.classList.add('hidden');
  quizScreenResult.classList.remove('hidden');

  const totalQuestions = QUIZ_QUESTIONS.length;
  // Skor dinamis terhitung tepat dari persentase jawaban benar
  const finalScore = Math.min(100, Math.round((correctAnswersCount / totalQuestions) * 100));
  quizScore = finalScore;

  quizFinalScore.textContent = `${quizScore} / 100`;

  const accuracy = Math.round((correctAnswersCount / totalQuestions) * 100);
  quizScorePercentage.textContent = `Tingkat Akurasi: ${accuracy}% (${correctAnswersCount} dari ${totalQuestions} soal benar)`;

  // Cek & update Highscore
  const previousHighScore = Number(localStorage.getItem(STORAGE_KEYS.QUIZ_HIGHSCORE)) || 0;
  if (quizScore > previousHighScore) {
    localStorage.setItem(STORAGE_KEYS.QUIZ_HIGHSCORE, String(quizScore));
    quizNewHighscoreBadge.classList.remove('hidden');
  } else {
    quizNewHighscoreBadge.classList.add('hidden');
  }

  updateQuizHighScoreDisplay();
}

/**
 * Reset dan kembali ke layar awal kuis
 */
function restartQuiz() {
  quizScreenResult.classList.add('hidden');
  quizScreenQuestion.classList.add('hidden');
  quizScreenStart.classList.remove('hidden');
  updateQuizHighScoreDisplay();
}

// =============================================================================
// 9. INITIALIZATION & EVENT LISTENERS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi tanggal hari ini pada form Expense Tracker
  if (expenseInputDate) {
    expenseInputDate.value = getTodayDateString();
  }

  // Tampilkan jumlah total soal pada layar kuis awal secara dinamis
  if (quizTotalQuestionsStart) {
    quizTotalQuestionsStart.textContent = QUIZ_QUESTIONS.length;
  }

  // Inisialisasi High Score kuis
  updateQuizHighScoreDisplay();

  // Inisialisasi Tab berdasarkan URL Query String (?tab=...)
  const initialTab = getActiveTabFromUrl();
  switchTab(initialTab, false);

  // ---------------------------------------------------------------------------
  // A. Event Listener Tab Navigation
  // ---------------------------------------------------------------------------
  const tabNavigation = document.getElementById('tab-navigation');
  if (tabNavigation) {
    tabNavigation.addEventListener('click', (e) => {
      const button = e.target.closest('.tab-btn');
      if (!button) return;
      const targetTab = button.dataset.tab;
      if (targetTab) {
        switchTab(targetTab, true);
      }
    });
  }

  // Handle tombol Back/Forward browser
  window.addEventListener('popstate', () => {
    const tabFromUrl = getActiveTabFromUrl();
    switchTab(tabFromUrl, false);
  });

  // ---------------------------------------------------------------------------
  // B. Event Listener Expense Tracker
  // ---------------------------------------------------------------------------
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleAddExpense);
  }

  if (expenseSearchInput) {
    expenseSearchInput.addEventListener('input', renderExpenses);
  }

  if (expenseFilterType) {
    expenseFilterType.addEventListener('change', renderExpenses);
  }

  if (expenseSortBy) {
    expenseSortBy.addEventListener('change', renderExpenses);
  }

  // Tombol Reset Data Expense
  const expenseBtnReset = document.getElementById('expense-btn-reset');
  if (expenseBtnReset) {
    expenseBtnReset.addEventListener('click', promptResetExpenses);
  }

  // Event delegation untuk Edit & Delete Transaksi
  if (expenseListContainer) {
    expenseListContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'edit-expense') {
        openEditExpenseModal(id);
      } else if (action === 'delete-expense') {
        promptDeleteExpense(id);
      }
    });
  }

  // Modal Edit Expense
  if (formEditExpense) {
    formEditExpense.addEventListener('submit', handleSaveEditExpense);
  }
  if (modalCloseEditExpense) {
    modalCloseEditExpense.addEventListener('click', closeEditExpenseModal);
  }
  if (modalCancelEditExpense) {
    modalCancelEditExpense.addEventListener('click', closeEditExpenseModal);
  }

  // ---------------------------------------------------------------------------
  // C. Event Listener Bookmark Manager
  // ---------------------------------------------------------------------------
  if (bookmarkForm) {
    bookmarkForm.addEventListener('submit', handleAddBookmark);
  }

  if (bookmarkSearchInput) {
    bookmarkSearchInput.addEventListener('input', renderBookmarks);
  }

  if (bookmarkSortBy) {
    bookmarkSortBy.addEventListener('change', renderBookmarks);
  }

  // Tombol Reset Data Bookmark
  const bookmarkBtnReset = document.getElementById('bookmark-btn-reset');
  if (bookmarkBtnReset) {
    bookmarkBtnReset.addEventListener('click', promptResetBookmarks);
  }

  // Event delegation untuk Edit & Delete Bookmark
  if (bookmarkGridContainer) {
    bookmarkGridContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'edit-bookmark') {
        openEditBookmarkModal(id);
      } else if (action === 'delete-bookmark') {
        promptDeleteBookmark(id);
      }
    });
  }

  // Modal Edit Bookmark
  if (formEditBookmark) {
    formEditBookmark.addEventListener('submit', handleSaveEditBookmark);
  }
  if (modalCloseEditBookmark) {
    modalCloseEditBookmark.addEventListener('click', closeEditBookmarkModal);
  }
  if (modalCancelEditBookmark) {
    modalCancelEditBookmark.addEventListener('click', closeEditBookmarkModal);
  }

  // ---------------------------------------------------------------------------
  // D. Event Listener Quiz App
  // ---------------------------------------------------------------------------
  if (quizBtnStart) {
    quizBtnStart.addEventListener('click', startQuiz);
  }

  if (quizOptionsContainer) {
    quizOptionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-option-btn');
      if (!btn || btn.disabled) return;
      const selectedIndex = Number(btn.dataset.index);
      handleSelectAnswer(selectedIndex);
    });
  }

  if (quizBtnNext) {
    quizBtnNext.addEventListener('click', handleNextQuestion);
  }

  if (quizBtnRestart) {
    quizBtnRestart.addEventListener('click', restartQuiz);
  }

  // ---------------------------------------------------------------------------
  // E. Event Listener Global Modal Konfirmasi Hapus
  // ---------------------------------------------------------------------------
  if (btnCancelDelete) {
    btnCancelDelete.addEventListener('click', hideDeleteConfirmation);
  }

  if (btnProceedDelete) {
    btnProceedDelete.addEventListener('click', () => {
      if (typeof onConfirmDeleteCallback === 'function') {
        onConfirmDeleteCallback();
      }
    });
  }

  // Tutup modal jika klik di area latar gelap (backdrop)
  [modalEditExpense, modalEditBookmark, modalConfirmDelete].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === modalEditExpense) closeEditExpenseModal();
        if (modal === modalEditBookmark) closeEditBookmarkModal();
        if (modal === modalConfirmDelete) hideDeleteConfirmation();
      }
    });
  });

  // Tutup modal dengan tombol Keyboard ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditExpenseModal();
      closeEditBookmarkModal();
      hideDeleteConfirmation();
    }
  });
});
