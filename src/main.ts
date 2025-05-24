interface Twist {
  id: number;
  content: string;
  threadId: number;
}

let twists: Twist[] = [];
let currentThreadId = 0;

const twistInput = document.getElementById("twistInput") as HTMLTextAreaElement;
const postTwistBtn = document.getElementById("postTwist") as HTMLButtonElement;
const twistContainer = document.getElementById("twistContainer") as HTMLDivElement;

postTwistBtn.addEventListener("click", () => {
  const text = twistInput.value.trim();
  if (text === "") return;

  const twist: Twist = {
    id: Date.now(),
    content: text,
    threadId: currentThreadId === 0 ? Date.now() : currentThreadId
  };

  if (currentThreadId === 0) {
    currentThreadId = twist.threadId;
  }

  twists.push(twist);
  renderTwists();
  twistInput.value = "";
});

function renderTwists() {
  twistContainer.innerHTML = "";

  const threads = new Map<number, Twist[]>();

  twists.forEach((twist) => {
    if (!threads.has(twist.threadId)) {
      threads.set(twist.threadId, []);
    }
    threads.get(twist.threadId)!.push(twist);
  });

  threads.forEach((threadTwists) => {
    const threadDiv = document.createElement("div");
    threadDiv.className = "twist-thread";

    threadTwists.forEach((twist) => {
      const twistDiv = document.createElement("div");
      twistDiv.className = "twist";
      twistDiv.textContent = twist.content;
      threadDiv.appendChild(twistDiv);
    });

    twistContainer.appendChild(threadDiv);
  });
}
