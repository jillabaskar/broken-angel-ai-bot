class Dice {
    constructor(scene) {
        this.scene = scene;
        this.currentValue = 1;
        this.isRolling = false;
        
        this.createDice();
    }

    createDice() {
        // Create dice group
        this.group = new THREE.Group();
        
        // Create dice cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create materials for each face with dots
        const materials = [];
        for (let i = 1; i <= 6; i++) {
            materials.push(this.createDiceFaceMaterial(i));
        }
        
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        // Position dice above the board
        this.group.position.set(10, 2, 10);
        this.scene.add(this.group);
    }

    createDiceFaceMaterial(number) {
        // Create canvas for dice face
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 128);

        // Border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 124, 124);

        // Draw dots
        ctx.fillStyle = '#000000';
        const dotRadius = 10;
        const positions = this.getDotPositions(number);

        positions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x * 128, pos.y * 128, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshPhongMaterial({ map: texture });
    }

    getDotPositions(number) {
        const positions = [];
        const center = 0.5;
        const offset = 0.25;

        switch (number) {
            case 1:
                positions.push({ x: center, y: center });
                break;
            case 2:
                positions.push({ x: offset, y: offset });
                positions.push({ x: 1 - offset, y: 1 - offset });
                break;
            case 3:
                positions.push({ x: offset, y: offset });
                positions.push({ x: center, y: center });
                positions.push({ x: 1 - offset, y: 1 - offset });
                break;
            case 4:
                positions.push({ x: offset, y: offset });
                positions.push({ x: 1 - offset, y: offset });
                positions.push({ x: offset, y: 1 - offset });
                positions.push({ x: 1 - offset, y: 1 - offset });
                break;
            case 5:
                positions.push({ x: offset, y: offset });
                positions.push({ x: 1 - offset, y: offset });
                positions.push({ x: center, y: center });
                positions.push({ x: offset, y: 1 - offset });
                positions.push({ x: 1 - offset, y: 1 - offset });
                break;
            case 6:
                positions.push({ x: offset, y: offset });
                positions.push({ x: 1 - offset, y: offset });
                positions.push({ x: offset, y: center });
                positions.push({ x: 1 - offset, y: center });
                positions.push({ x: offset, y: 1 - offset });
                positions.push({ x: 1 - offset, y: 1 - offset });
                break;
        }

        return positions;
    }

    roll() {
        if (this.isRolling) return Promise.resolve(this.currentValue);

        this.isRolling = true;
        const result = Math.floor(Math.random() * 6) + 1;
        
        return new Promise((resolve) => {
            const duration = 1000;
            const startTime = Date.now();
            const rotations = 5;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth deceleration
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                // Random rotation during roll
                this.mesh.rotation.x = easeProgress * rotations * Math.PI * 2 + Math.random() * 0.1;
                this.mesh.rotation.y = easeProgress * rotations * Math.PI * 2 + Math.random() * 0.1;
                this.mesh.rotation.z = easeProgress * rotations * Math.PI * 2 + Math.random() * 0.1;

                // Bounce effect
                const bounceHeight = Math.sin(progress * Math.PI) * 2;
                this.group.position.y = 2 + bounceHeight;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Set final rotation to show the result
                    this.setRotationForValue(result);
                    this.currentValue = result;
                    this.isRolling = false;
                    resolve(result);
                }
            };

            animate();
        });
    }

    setRotationForValue(value) {
        // Reset rotation
        this.mesh.rotation.set(0, 0, 0);

        // Set rotation to show specific face on top
        switch (value) {
            case 1:
                this.mesh.rotation.set(0, 0, 0);
                break;
            case 2:
                this.mesh.rotation.set(0, Math.PI / 2, 0);
                break;
            case 3:
                this.mesh.rotation.set(0, 0, -Math.PI / 2);
                break;
            case 4:
                this.mesh.rotation.set(0, 0, Math.PI / 2);
                break;
            case 5:
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                break;
            case 6:
                this.mesh.rotation.set(Math.PI, 0, 0);
                break;
        }
    }

    getValue() {
        return this.currentValue;
    }

    reset() {
        this.currentValue = 1;
        this.setRotationForValue(1);
        this.group.position.y = 2;
    }
}
