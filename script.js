class SisonCPUSimulator {
  constructor() {
    this.registers = {
      AC: 0, // Accumulator
      PC: 0, // Program Counter
      IR: "", // Instruction Register
    };

    this.memory = [];
    this.instructions = [];
    this.dataAddresses = new Set();
    this.isRunning = false;
    this.output = [];
    this.currentStep = 0;
    this.programHalted = false;

    this.initializeEventListeners();
    this.generateInstructions(4); // Default to 4 instructions
    this.updateOutput(
      "Program ready. Set up instructions and click Run or Step to begin execution.\n"
    );
  }

  initializeEventListeners() {
    document.getElementById("generate-btn").addEventListener("click", () => {
      const count = parseInt(
        document.getElementById("instruction-count").value
      );
      this.generateInstructions(count);
    });

    document
      .getElementById("run-btn")
      .addEventListener("click", () => this.run());
    document
      .getElementById("step-btn")
      .addEventListener("click", () => this.step());
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.reset());
  }

  generateInstructions(count) {
    const instructionsBody = document.getElementById("instructions-body");
    instructionsBody.innerHTML = "";

    this.instructions = [];
    this.dataAddresses.clear();
    this.programHalted = false;

    // Generate random instructions
    const instructionTypes = ["LOAD", "ADD", "SUB", "STORE"];

    for (let i = 0; i < count - 1; i++) {
      const type =
        instructionTypes[Math.floor(Math.random() * instructionTypes.length)];
      const operand = 10 + Math.floor(Math.random() * 99); // Random address between 5-9
      this.instructions.push({ address: i, type, operand });
      this.dataAddresses.add(operand);
    }

    // Always end with HLT
    this.instructions.push({ address: count - 1, type: "HLT", operand: "" });

    // Render instructions table
    this.instructions.forEach((instruction) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${instruction.address}</td>
                <td>
                    <select class="instruction-type" data-address="${
                      instruction.address
                    }">
                        <option value="LOAD" ${
                          instruction.type === "LOAD" ? "selected" : ""
                        }>LOAD</option>
                        <option value="STORE" ${
                          instruction.type === "STORE" ? "selected" : ""
                        }>STORE</option>
                        <option value="ADD" ${
                          instruction.type === "ADD" ? "selected" : ""
                        }>ADD</option>
                        <option value="SUB" ${
                          instruction.type === "SUB" ? "selected" : ""
                        }>SUB</option>
                        <option value="HLT" ${
                          instruction.type === "HLT" ? "selected" : ""
                        }>HLT</option>
                    </select>
                </td>
                <td>
                    ${
                      instruction.type === "HLT"
                        ? "Address"
                        : `<input type="number" class="operand" data-address="${instruction.address}" value="${instruction.operand}" min="5" max="20">`
                    }
                </td>
            `;
      instructionsBody.appendChild(row);
    });

    // Add event listeners to instruction selects and operand inputs
    document.querySelectorAll(".instruction-type").forEach((select) => {
      select.addEventListener("change", (e) => {
        this.handleInstructionChange(e.target);
      });
    });

    document.querySelectorAll(".operand").forEach((input) => {
      input.addEventListener("change", (e) => {
        this.handleOperandChange(e.target);
      });
    });

    this.generateDataTable();
    this.renderMemory();
    this.updateRegisters();
  }

  handleInstructionChange(select) {
    const address = parseInt(select.dataset.address);
    const newType = select.value;
    const instruction = this.instructions.find(
      (inst) => inst.address === address
    );

    instruction.type = newType;
    this.programHalted = false;

    if (newType === "HLT") {
      instruction.operand = "";
    } else {
      // Generate a new operand if needed
      if (!instruction.operand || instruction.operand === "") {
        instruction.operand = 5 + Math.floor(Math.random() * 5);
      }
    }

    this.generateDataTable();
    this.renderInstructionsTable();
  }

  handleOperandChange(input) {
    const address = parseInt(input.dataset.address);
    const newOperand = parseInt(input.value);
    const instruction = this.instructions.find(
      (inst) => inst.address === address
    );

    instruction.operand = newOperand;
    this.generateDataTable();
  }

  renderInstructionsTable() {
    const instructionsBody = document.getElementById("instructions-body");
    instructionsBody.innerHTML = "";

    this.instructions.forEach((instruction) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${instruction.address}</td>
                <td>
                    <select class="instruction-type" data-address="${
                      instruction.address
                    }">
                        <option value="LOAD" ${
                          instruction.type === "LOAD" ? "selected" : ""
                        }>LOAD</option>
                        <option value="STORE" ${
                          instruction.type === "STORE" ? "selected" : ""
                        }>STORE</option>
                        <option value="ADD" ${
                          instruction.type === "ADD" ? "selected" : ""
                        }>ADD</option>
                        <option value="SUB" ${
                          instruction.type === "SUB" ? "selected" : ""
                        }>SUB</option>
                        <option value="HLT" ${
                          instruction.type === "HLT" ? "selected" : ""
                        }>HLT</option>
                    </select>
                </td>
                <td>
                    ${
                      instruction.type === "HLT"
                        ? "Address"
                        : `<input type="number" class="operand" data-address="${instruction.address}" value="${instruction.operand}" min="5" max="20">`
                    }
                </td>
            `;
      instructionsBody.appendChild(row);
    });

    // Re-add event listeners
    document.querySelectorAll(".instruction-type").forEach((select) => {
      select.addEventListener("change", (e) => {
        this.handleInstructionChange(e.target);
      });
    });

    document.querySelectorAll(".operand").forEach((input) => {
      input.addEventListener("change", (e) => {
        this.handleOperandChange(e.target);
      });
    });
  }

  // In the generateDataTable() method, replace with this:
  generateDataTable() {
    const dataBody = document.getElementById("data-body");
    dataBody.innerHTML = "";

    // Collect all data addresses from instructions in the order they appear
    this.dataAddresses.clear();
    const addressOrder = [];

    this.instructions.forEach((instruction) => {
      if (instruction.type !== "HLT" && instruction.operand) {
        const address = instruction.operand;
        if (!addressOrder.includes(address)) {
          addressOrder.push(address);
        }
      }
    });

    // Create data table rows in the order they appear in instructions
    addressOrder.forEach((address) => {
      const row = document.createElement("tr");
      const currentValue =
        this.memory[address] || Math.floor(Math.random() * 50) + 1;
      row.innerHTML = `
            <td>${address}</td>
            <td>
                <input type="number" class="data-value" data-address="${address}" value="${currentValue}">
            </td>
        `;
      dataBody.appendChild(row);
    });

    // Add event listeners to data value inputs
    document.querySelectorAll(".data-value").forEach((input) => {
      input.addEventListener("change", (e) => {
        const address = parseInt(e.target.dataset.address);
        const value = parseInt(e.target.value);
        this.memory[address] = value;
        this.renderMemory();
      });
    });

    // Initialize memory with data values
    document.querySelectorAll(".data-value").forEach((input) => {
      const address = parseInt(input.dataset.address);
      const value = parseInt(input.value);
      this.memory[address] = value;
    });

    this.renderMemory();
  }

  renderMemory() {
    const memoryContainer = document.getElementById("memory-container");
    memoryContainer.innerHTML = "";

    // Show instruction addresses in order (0, 1, 2, 3...)
    this.instructions.forEach((instruction) => {
      const memoryCell = document.createElement("div");
      memoryCell.className = "memory-cell";
      memoryCell.id = `mem-${instruction.address}`;

      const displayValue =
        instruction.type === "HLT"
          ? "HLT"
          : `${instruction.type} ${instruction.operand}`;

      memoryCell.innerHTML = `
            <div class="memory-address">Address ${instruction.address}</div>
            <div class="memory-value">${displayValue}</div>
        `;

      memoryContainer.appendChild(memoryCell);
    });

    // Show data addresses in the order they appear in instructions
    const dataAddressesInOrder = [];
    this.instructions.forEach((instruction) => {
      if (instruction.type !== "HLT" && instruction.operand) {
        const address = instruction.operand;
        if (!dataAddressesInOrder.includes(address)) {
          dataAddressesInOrder.push(address);
        }
      }
    });

    dataAddressesInOrder.forEach((address) => {
      const memoryCell = document.createElement("div");
      memoryCell.className = "memory-cell";
      memoryCell.id = `mem-${address}`;

      memoryCell.innerHTML = `
            <div class="memory-address">Address ${address}</div>
            <div class="memory-value">${this.memory[address] || 0}</div>
        `;

      memoryContainer.appendChild(memoryCell);
    });
  }

  updateRegisters() {
    document.getElementById("ac").querySelector(".register-value").textContent =
      this.registers.AC;
    document.getElementById("pc").querySelector(".register-value").textContent =
      this.registers.PC;
    document.getElementById("ir").querySelector(".register-value").textContent =
      this.registers.IR || "-";
  }

  highlightRegister(register) {
    // Remove active class from all registers
    document.querySelectorAll(".register").forEach((reg) => {
      reg.classList.remove("active");
    });

    // Add active class to specified register
    if (register) {
      document.getElementById(register.toLowerCase()).classList.add("active");
    }
  }

  highlightMemory(address) {
    // Remove active class from all memory cells
    document.querySelectorAll(".memory-cell").forEach((cell) => {
      cell.classList.remove("active");
    });

    // Add active class to specified memory address
    if (address !== undefined) {
      const memoryCell = document.getElementById(`mem-${address}`);
      if (memoryCell) {
        memoryCell.classList.add("active");
      }
    }
  }

  updateOutput(message) {
    if (this.programHalted) return; // Stop printing after HALT

    const outputContent = document.getElementById("output-content");
    this.output.push(message);
    outputContent.textContent = this.output.join("");
    outputContent.scrollTop = outputContent.scrollHeight;
  }

  async step() {
    if (this.programHalted) {
      this.updateOutput("Program already halted. Reset to run again.\n");
      return;
    }

    if (this.registers.PC >= this.instructions.length) {
      this.updateOutput("Program completed. Reset to run again.\n");
      return;
    }

    const instruction = this.instructions[this.registers.PC];

    if (instruction.type === "HLT") {
      this.updateOutput(`PC=${this.registers.PC} IR=HLT `);
      this.updateOutput(`Program Halted.\n`);
      this.programHalted = true;
      document.getElementById("step-btn").disabled = true;
      document.getElementById("run-btn").disabled = true;

      // Add halted styling to output
      const outputContent = document.getElementById("output-content");
      outputContent.classList.add("halted");
      return;
    }

    // Update IR
    this.registers.IR = `${instruction.type} ${instruction.operand}`;
    this.highlightRegister("ir");
    this.updateRegisters();

    this.updateOutput(`PC=${this.registers.PC} IR=${this.registers.IR} `);

    // Execute instruction
    switch (instruction.type) {
      case "LOAD":
        await this.executeLoad(instruction.operand);
        break;
      case "STORE":
        await this.executeStore(instruction.operand);
        break;
      case "ADD":
        await this.executeAdd(instruction.operand);
        break;
      case "SUB":
        await this.executeSub(instruction.operand);
        break;
    }

    // Increment PC
    this.registers.PC++;
    this.highlightRegister("pc");
    this.updateRegisters();

    await this.delay(500);
  }

  async executeLoad(address) {
    const oldAC = this.registers.AC;
    this.registers.AC = this.memory[address] || 0;
    this.highlightRegister("ac");
    this.highlightMemory(address);
    this.updateRegisters();
    this.updateOutput(
      `AC=${oldAC}→${this.registers.AC} (loaded from memory[${address}]=${this.memory[address]})\n`
    );
    await this.delay(800);
  }

  async executeStore(address) {
    const oldValue = this.memory[address] || 0;
    this.memory[address] = this.registers.AC;
    this.highlightMemory(address);
    this.renderMemory();
    this.updateOutput(
      `Memory[${address}]=${oldValue}→${this.memory[address]} (stored from AC=${this.registers.AC})\n`
    );
    await this.delay(800);
  }

  async executeAdd(address) {
    const oldAC = this.registers.AC;
    this.registers.AC += this.memory[address] || 0;
    this.highlightRegister("ac");
    this.highlightMemory(address);
    this.updateRegisters();
    this.updateOutput(
      `AC=${oldAC}→${this.registers.AC} (added memory[${address}]=${this.memory[address]})\n`
    );
    await this.delay(800);
  }

  async executeSub(address) {
    const oldAC = this.registers.AC;
    this.registers.AC -= this.memory[address] || 0;
    this.highlightRegister("ac");
    this.highlightMemory(address);
    this.updateRegisters();
    this.updateOutput(
      `AC=${oldAC}→${this.registers.AC} (subtracted memory[${address}]=${this.memory[address]})\n`
    );
    await this.delay(800);
  }

  async run() {
    if (this.isRunning || this.programHalted) return;

    this.isRunning = true;
    document.getElementById("step-btn").disabled = true;
    document.getElementById("run-btn").disabled = true;

    this.updateOutput("Starting program execution...\n");

    while (
      this.registers.PC < this.instructions.length &&
      this.isRunning &&
      !this.programHalted
    ) {
      await this.step();
      await this.delay(1000);
    }

    if (!this.programHalted) {
      this.updateOutput("\nProgram execution completed.\n");
    }

    this.isRunning = false;
    document.getElementById("step-btn").disabled = false;
    document.getElementById("run-btn").disabled = false;
  }

  reset() {
    this.registers = {
      AC: 0,
      PC: 0,
      IR: "",
    };

    this.isRunning = false;
    this.programHalted = false;
    this.output = [];
    this.currentStep = 0;

    document.getElementById("step-btn").disabled = false;
    document.getElementById("run-btn").disabled = false;

    // Remove halted styling
    const outputContent = document.getElementById("output-content");
    outputContent.classList.remove("halted");

    this.updateRegisters();
    this.highlightRegister(null);
    this.highlightMemory(null);
    this.updateOutput(
      "Program reset. Set up instructions and click Run or Step to begin execution.\n"
    );
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the simulator when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SisonCPUSimulator();
});
