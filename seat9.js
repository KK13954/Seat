document.addEventListener("DOMContentLoaded", function () {
  generateSeats();
  setupColorOptions();
});

let currentEditSeat = null;

function generateSeats() {
  const rows = document.getElementById("rows").value;
  const cols = document.getElementById("cols").value;
  const seatChart = document.getElementById("seatChart");
  seatChart.innerHTML = "";
  seatChart.style.display = "grid";
  seatChart.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  seatChart.style.gap = "5px";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seat = document.createElement("div");
      seat.classList.add("seat");
      seat.dataset.position = `${r}-${c}`;
      seat.draggable = true;

      const nameKey = `seat9-seat-${r}-${c}-name`;
      const memoKey = `seat9-seat-${r}-${c}-memo`;
      const colorKey = `seat9-seat-${r}-${c}-color`;

      const savedName = localStorage.getItem(nameKey) || "";
      const savedMemo = localStorage.getItem(memoKey) || "";
      const savedColor = localStorage.getItem(colorKey) || "#f0f0f0";

      seat.textContent = savedName;
      seat.style.backgroundColor = savedColor;

      seat.dataset.name = savedName;
      seat.dataset.memo = savedMemo;
      seat.dataset.color = savedColor;

      seat.addEventListener("click", () => {
        currentEditSeat = seat;
        document.getElementById("editName").value = seat.dataset.name || "";
        document.getElementById("editMemo").value = seat.dataset.memo || "";
        document.getElementById("editColor").value = seat.dataset.color || "#f0f0f0";

        // モーダル手書きメモを座席ごとにロード
        const canvas = document.getElementById("modalHandwritingMemo");
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const pos = seat.dataset.position;
          const saved = localStorage.getItem(`seat9-modalHandwritingMemo-${pos}`);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (saved) {
            const img = new window.Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = saved;
          }
        }
        document.getElementById("editModal").style.display = "block";
      });

      seat.addEventListener("dragstart", dragStart);
      seat.addEventListener("dragover", dragOver);
      seat.addEventListener("drop", drop);

      seatChart.appendChild(seat);
    }
  }
}

function setupColorOptions() {
  const colorPalette = document.getElementById("colorPalette");
  const hiddenInput = document.getElementById("editColor");
  const colors = [
    "#f0f0f0", "#ff4d4d", "#ff99cc", "#faa441", "#f8f405",
    "#3399ff", "#66ffff", "#66cc66", "#6dfa10", "#cc99ff"
  ];

  colorPalette.innerHTML = "";
  colors.forEach(color => {
    const colorDiv = document.createElement("div");
    colorDiv.classList.add("color-option");
    colorDiv.style.backgroundColor = color;
    colorDiv.dataset.color = color;

    colorDiv.addEventListener("click", () => {
      // 選択状態の更新
      document.querySelectorAll(".color-option").forEach(el => el.classList.remove("selected"));
      colorDiv.classList.add("selected");

      hiddenInput.value = color;
    });

    colorPalette.appendChild(colorDiv);
  });

  document.getElementById("saveButton").addEventListener("click", () => {
    if (!currentEditSeat) return;
    const pos = currentEditSeat.dataset.position;
    const name = document.getElementById("editName").value;
    const memo = document.getElementById("editMemo").value;
    const color = document.getElementById("editColor").value;

    // ★モーダル手書きメモを保存
    const canvas = document.getElementById("modalHandwritingMemo");
    if (canvas) {
      localStorage.setItem(
        `seat9-modalHandwritingMemo-${pos}`,
        canvas.toDataURL()
      );
    }

    localStorage.setItem(`seat9-seat-${pos}-name`, name);
    localStorage.setItem(`seat9-seat-${pos}-memo`, memo);
    localStorage.setItem(`seat9-seat-${pos}-color`, color);

    currentEditSeat.textContent = name;
    currentEditSeat.style.backgroundColor = color;

    currentEditSeat.dataset.name = name;
    currentEditSeat.dataset.memo = memo;
    currentEditSeat.dataset.color = color;

    document.getElementById("editModal").style.display = "none";
    currentEditSeat = null;
  });

  document.getElementById("cancelButton").addEventListener("click", () => {
    // ★キャンセル時も念のため保存
    if (currentEditSeat) {
      const pos = currentEditSeat.dataset.position;
      const canvas = document.getElementById("modalHandwritingMemo");
      if (canvas) {
        localStorage.setItem(
          `seat9-modalHandwritingMemo-${pos}`,
          canvas.toDataURL()
        );
      }
    }
    document.getElementById("editModal").style.display = "none";
    currentEditSeat = null;
  });
}

// リセットボタン処理
document.getElementById("resetButton").addEventListener("click", function () {
  if (confirm("すべての座席データ（氏名・メモ・手書きメモ・色）を消去します。よろしいですか？")) {
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith("seat9-seat-") ||
        key.startsWith("seat9-modalHandwritingMemo-")
      ) {
        localStorage.removeItem(key);
      }
    });
    generateSeats();
    // 手書きメモ欄もクリア
    const modalCanvas = document.getElementById("modalHandwritingMemo");
    if (modalCanvas) {
      const ctx = modalCanvas.getContext("2d");
      ctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
    }
    const mainCanvas = document.getElementById("handwritingMemo");
    if (mainCanvas) {
      const ctx = mainCanvas.getContext("2d");
      ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    }
  }
});

// 席替え
function shuffleSeats() {
  const seats = Array.from(document.querySelectorAll(".seat"));
  const data = seats.map(seat => ({
    name: seat.dataset.name || "",
    memo: seat.dataset.memo || "",
    color: seat.dataset.color || "#f0f0f0"
  }));

  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }

  seats.forEach((seat, i) => {
    const pos = seat.dataset.position;
    seat.textContent = data[i].name;
    seat.style.backgroundColor = data[i].color;
    seat.dataset.name = data[i].name;
    seat.dataset.memo = data[i].memo;
    seat.dataset.color = data[i].color;

    localStorage.setItem(`seat9-seat-${pos}-name`, data[i].name);
    localStorage.setItem(`seat9-seat-${pos}-memo`, data[i].memo);
    localStorage.setItem(`seat9-seat-${pos}-color`, data[i].color);
  });
}

// ドラッグ＆ドロップ
let draggedSeat = null;

function dragStart(e) {
  draggedSeat = e.currentTarget;
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const targetSeat = e.currentTarget;
  if (draggedSeat && draggedSeat !== targetSeat) {
    // 入れ替え対象の情報を取得
    const temp = {
      name: draggedSeat.dataset.name,
      memo: draggedSeat.dataset.memo,
      color: draggedSeat.dataset.color
    };

    // draggedSeat ← targetSeat
    draggedSeat.dataset.name = targetSeat.dataset.name;
    draggedSeat.dataset.memo = targetSeat.dataset.memo;
    draggedSeat.dataset.color = targetSeat.dataset.color;
    draggedSeat.textContent = targetSeat.dataset.name;
    draggedSeat.style.backgroundColor = targetSeat.dataset.color;

    // targetSeat ← temp
    targetSeat.dataset.name = temp.name;
    targetSeat.dataset.memo = temp.memo;
    targetSeat.dataset.color = temp.color;
    targetSeat.textContent = temp.name;
    targetSeat.style.backgroundColor = temp.color;

    // localStorage 更新
    const pos1 = draggedSeat.dataset.position;
    const pos2 = targetSeat.dataset.position;

    localStorage.setItem(`seat9-seat-${pos1}-name`, draggedSeat.dataset.name);
    localStorage.setItem(`seat9-seat-${pos1}-memo`, draggedSeat.dataset.memo);
    localStorage.setItem(`seat9-seat-${pos1}-color`, draggedSeat.dataset.color);

    localStorage.setItem(`seat9-seat-${pos2}-name`, targetSeat.dataset.name);
    localStorage.setItem(`seat9-seat-${pos2}-memo`, targetSeat.dataset.memo);
    localStorage.setItem(`seat9-seat-${pos2}-color`, targetSeat.dataset.color);
  }
}

// 手書きメモ欄の描画処理
window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("handwritingMemo");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let lastX = 0, lastY = 0;

  // 保存した手書きデータがあれば復元
  const saved = localStorage.getItem("handwritingMemo");
  if (saved) {
    const img = new window.Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved;
  }

  function startDraw(e) {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    lastY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  }
  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
    // 保存
    localStorage.setItem("handwritingMemo", canvas.toDataURL());
  }
  function endDraw() {
    drawing = false;
    localStorage.setItem("handwritingMemo", canvas.toDataURL());
  }

  // マウス
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  // タッチ
  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchmove", function(e){ draw(e); e.preventDefault(); }, {passive:false});
  canvas.addEventListener("touchend", endDraw);

  // クリアボタン
  document.getElementById("clearHandwritingMemo").onclick = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem("handwritingMemo");
  };
});

// 編集モーダル用 手書きメモ欄
window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("modalHandwritingMemo");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let lastX = 0, lastY = 0;

  // 座席ごとに保存・読込
  function loadModalHandwritingMemo(pos) {
    const saved = localStorage.getItem(`seat9-modalHandwritingMemo-${pos}`);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (saved) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    }
  }

  function saveModalHandwritingMemo(pos) {
    // 直前の描画イベントが終わる前にcurrentEditSeatがnullになる場合があるため
    if (!pos) return;
    localStorage.setItem(`seat9-modalHandwritingMemo-${pos}`, canvas.toDataURL());
  }

  function getCurrentSeatPos() {
    // currentEditSeatがnullになる場合があるので安全に取得
    return window.currentEditSeat ? window.currentEditSeat.dataset.position : null;
  }

  function startDraw(e) {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    lastY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  }
  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
    // 座席ごとに保存
    const pos = getCurrentSeatPos();
    if (pos) saveModalHandwritingMemo(pos);
  }
  function endDraw() {
    drawing = false;
    const pos = getCurrentSeatPos();
    if (pos) saveModalHandwritingMemo(pos);
  }

  // マウス
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  // タッチ
  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchmove", function(e){ draw(e); e.preventDefault(); }, {passive:false});
  canvas.addEventListener("touchend", endDraw);

  // クリアボタン
  const clearBtn = document.getElementById("clearModalHandwritingMemo");
  if (clearBtn) {
    clearBtn.onclick = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pos = getCurrentSeatPos();
      if (pos) localStorage.removeItem(`seat9-modalHandwritingMemo-${pos}`);
    };
  }

  // モーダル表示時に手書きメモをロード
  const modal = document.getElementById("editModal");
  const observer = new MutationObserver(() => {
    if (modal.style.display !== "none" && window.currentEditSeat) {
      loadModalHandwritingMemo(window.currentEditSeat.dataset.position);
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
});

