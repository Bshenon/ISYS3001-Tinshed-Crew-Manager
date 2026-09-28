// SCRUM-7: crew assignments and roster. The same localStorage origin must be used on every page.
const RosterRules = {
  crewCall(type) {
    const call = [
      { role: "Stage Manager", count: 1 },
      { role: "Lighting Operator", count: 1 },
      { role: "Sound Operator", count: 1 },
      { role: "Front of House", count: 1 },
      { role: "Box Office", count: 1 },
      { role: "Usher", count: 2 }
    ];
    if (type === "evening") call.splice(5, 0, { role: "Bar", count: 2 });
    return call;
  },
  check(assignment, assignments, performance, volunteers, excludeId = null) {
    if (!performance) return "Select a performance first.";
    const volunteer = volunteers.find(v => String(v.id) === String(assignment.volunteerId));
    if (!volunteer) return "Volunteer not found.";
    if (volunteer.active === false) return "An inactive volunteer cannot be assigned.";
    const call = performance.crewCall.find(item => item.role === assignment.role);
    if (!call) return "That role is not required for this performance.";
    const others = assignments.filter(a => String(a.id) !== String(excludeId) && String(a.performanceId) === String(performance.id));
    if (others.some(a => String(a.volunteerId) === String(assignment.volunteerId))) {
      return "This volunteer already has a role at this performance. One role per performance is allowed.";
    }
    if (others.filter(a => a.role === assignment.role).length >= call.count) return "All positions for that role are filled.";
    return null;
  },
  rows(performance, assignments, volunteers) {
    if (!performance) return [];
    return performance.crewCall.map(item => {
      const filled = assignments.filter(a => String(a.performanceId) === String(performance.id) && a.role === item.role);
      return { role: item.role, required: item.count, filled, open: Math.max(0, item.count - filled.length), volunteers: filled.map(a => volunteers.find(v => String(v.id) === String(a.volunteerId))?.name || "Unknown volunteer") };
    });
  }
};
if (typeof module !== "undefined") module.exports = RosterRules;

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const read = key => {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const say = (message, error = false) => { $("message").textContent = message; $("message").className = error ? "error" : "success"; };
  const option = (value, label) => { const el = document.createElement("option"); el.value = value; el.textContent = label; return el; };
  const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

  // The volunteer page originally had no IDs. Give existing records IDs once and save them.
  function volunteers() {
    const list = read("volunteers");
    let changed = false;
    list.forEach(v => { if (v.id == null) { v.id = uid(); changed = true; } });
    if (changed) localStorage.setItem("volunteers", JSON.stringify(list));
    return list;
  }
  const performances = () => read("performances");
  const assignments = () => read("assignments");
  const selectedPerformance = () => performances().find(p => String(p.id) === $("performanceSelect").value);

  function refresh(preferredId) {
    const people = volunteers();
    const shows = performances();
    const currentId = preferredId || $("performanceSelect").value;
    clear($("performanceSelect"));
    shows.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    shows.forEach(p => $("performanceSelect").appendChild(option(p.id, `${p.productionTitle} — ${p.date} ${p.time}`)));
    if (shows.some(p => String(p.id) === String(currentId))) $("performanceSelect").value = currentId;
    const p = selectedPerformance();
    $("performanceInfo").textContent = p ? `${p.productionTitle} — ${p.date} at ${p.time}` : "No performances yet. Add one above or wait for SCRUM-6.";
    clear($("roleSelect"));
    (p?.crewCall || []).forEach(item => $("roleSelect").appendChild(option(item.role, item.role)));
    for (const id of ["volunteerSelect", "myVolunteerSelect"]) {
      const select = $(id), previous = select.value;
      clear(select);
      (id === "volunteerSelect" ? people.filter(v => v.active !== false) : people).forEach(v => select.appendChild(option(v.id, v.name)));
      if (people.some(v => String(v.id) === previous)) select.value = previous;
    }
    $("assignmentForm").querySelector("button").disabled = !p || !people.some(v => v.active !== false);
    renderRoster(); renderOwn();
  }

  function renderRoster() {
    const container = $("rosterView"), p = selectedPerformance(), people = volunteers(), all = assignments();
    clear(container);
    if (!p) { container.textContent = "No performance selected."; return; }
    const table = document.createElement("table");
    const head = document.createElement("tr");
    for (const label of ["Role", "Required", "Filled", "Open", "Assignments"]) { const th = document.createElement("th"); th.textContent = label; head.appendChild(th); }
    table.appendChild(head);
    RosterRules.rows(p, all, people).forEach(row => {
      const tr = document.createElement("tr");
      for (const value of [row.role, row.required, row.filled.length, row.open]) {
        const td = document.createElement("td"); td.textContent = value; if (value === row.open && row.open > 0 && tr.children.length === 3) td.className = "open"; tr.appendChild(td);
      }
      const td = document.createElement("td");
      row.filled.forEach(a => {
        const div = document.createElement("div");
        const name = people.find(v => String(v.id) === String(a.volunteerId))?.name || "Unknown volunteer";
        const span = document.createElement("span"); span.textContent = `${name} (${a.confirmed ? "confirmed" : "unconfirmed"}) `; div.appendChild(span);
        const change = document.createElement("button"); change.textContent = "Change"; change.addEventListener("click", () => changeAssignment(a)); div.appendChild(change);
        const confirm = document.createElement("button"); confirm.textContent = a.confirmed ? "Unconfirm" : "Confirm";
        confirm.addEventListener("click", () => { const list = assignments(); const target = list.find(x => String(x.id) === String(a.id)); target.confirmed = !target.confirmed; localStorage.setItem("assignments", JSON.stringify(list)); refresh(p.id); }); div.appendChild(confirm);
        const remove = document.createElement("button"); remove.textContent = "Remove";
        remove.addEventListener("click", () => { localStorage.setItem("assignments", JSON.stringify(assignments().filter(x => String(x.id) !== String(a.id)))); say("Assignment removed; the position is open again."); refresh(p.id); }); div.appendChild(remove);
        td.appendChild(div);
      });
      if (row.open) { const open = document.createElement("div"); open.textContent = `${row.open} open`; open.className = "open"; td.appendChild(open); }
      tr.appendChild(td); table.appendChild(tr);
    });
    container.appendChild(table);
  }

  function changeAssignment(existing) {
    const p = selectedPerformance(), people = volunteers().filter(v => v.active !== false);
    const names = people.map(v => `${v.id}: ${v.name}`).join("\n");
    const chosen = prompt(`Enter the ID of the replacement volunteer:\n${names}`, existing.volunteerId);
    if (chosen === null) return;
    const available = performances();
    const targetInput = prompt(`Performance ID (leave unchanged to stay on this performance):\n${available.map(x => `${x.id}: ${x.productionTitle} ${x.date} ${x.time}`).join("\n")}`, existing.performanceId);
    if (targetInput === null) return;
    const target = available.find(x => String(x.id) === targetInput.trim());
    const newRole = prompt(`Role for the target performance:\n${(target?.crewCall || []).map(x => x.role).join("\n")}`, existing.role);
    if (newRole === null) return;
    const replacement = { ...existing, volunteerId: chosen.trim(), performanceId: targetInput.trim(), role: newRole.trim(), confirmed: false };
    const list = assignments();
    const error = RosterRules.check(replacement, list, target, volunteers(), existing.id);
    if (error) { say(error, true); return; }
    const index = list.findIndex(a => String(a.id) === String(existing.id));
    list[index] = replacement;
    localStorage.setItem("assignments", JSON.stringify(list)); say("Assignment changed; it is now unconfirmed."); refresh(replacement.performanceId);
  }

  function renderOwn() {
    const area = $("myAssignments"); clear(area);
    const id = $("myVolunteerSelect").value;
    if (!id) { area.textContent = "No volunteers yet."; return; }
    const mine = assignments().filter(a => String(a.volunteerId) === id);
    if (!mine.length) { area.textContent = "No assignments for this volunteer."; return; }
    const list = document.createElement("ul");
    mine.forEach(a => { const p = performances().find(x => String(x.id) === String(a.performanceId)); if (!p) return;
      const li = document.createElement("li"); li.textContent = `${p.productionTitle} — ${p.date} ${p.time} — ${a.role} — ${a.confirmed ? "confirmed" : "unconfirmed"}`; list.appendChild(li);
    });
    area.appendChild(list);
  }

  $("performanceForm").addEventListener("submit", event => {
    event.preventDefault();
    const p = { id: uid(), productionTitle: $("productionTitle").value.trim(), date: $("performanceDate").value, time: $("performanceTime").value, crewCall: RosterRules.crewCall($("callType").value) };
    const list = performances(); list.push(p); localStorage.setItem("performances", JSON.stringify(list));
    event.target.reset(); say("Performance saved for roster testing."); refresh(p.id);
  });
  $("assignmentForm").addEventListener("submit", event => {
    event.preventDefault(); const p = selectedPerformance();
    const a = { id: uid(), performanceId: p?.id, volunteerId: $("volunteerSelect").value, role: $("roleSelect").value, confirmed: false };
    const list = assignments(), error = RosterRules.check(a, list, p, volunteers());
    if (error) { say(error, true); return; }
    list.push(a); localStorage.setItem("assignments", JSON.stringify(list)); say("Volunteer assigned as unconfirmed."); refresh(p.id);
  });
  $("performanceSelect").addEventListener("change", () => refresh());
  $("myVolunteerSelect").addEventListener("change", renderOwn);
  window.addEventListener("storage", () => refresh());
  refresh();
}
