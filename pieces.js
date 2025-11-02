class GamePiece {
    constructor(scene, playerId, pieceIndex, color, position) {
        this.scene = scene;
        this.playerId = playerId;
        this.pieceIndex = pieceIndex;
        this.color = color;
        this.position = -1; // -1 means in home
        this.isInWinningPath = false;
        this.winningPathIndex = -1;
        this.hasFinished = false;
        this.isSelected = false;
        
        this.createPiece(position);
    }

    createPiece(position) {
        // Create piece group
        this.group = new THREE.Group();
        
        // Base cylinder
        const baseGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 100
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        this.group.add(base);

        // Top sphere
        const topGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 100
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.3;
        top.castShadow = true;
        this.group.add(top);

        // Selection ring (initially hidden)
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionRing.rotation.x = Math.PI / 2;
        this.selectionRing.position.y = -0.15;
        this.selectionRing.visible = false;
        this.group.add(this.selectionRing);

        // Set initial position
        this.group.position.set(position.x, 0.5, position.z);
        
        // Store reference for raycasting
        this.mesh = this.group;
        this.mesh.userData = {
            type: 'piece',
            playerId: this.playerId,
            pieceIndex: this.pieceIndex,
            pieceObject: this
        };

        this.scene.add(this.group);
    }

    setSelected(selected) {
        this.isSelected = selected;
        this.selectionRing.visible = selected;
        
        if (selected) {
            // Bounce animation
            this.animateBounce();
        }
    }

    animateBounce() {
        const startY = this.group.position.y;
        const bounceHeight = 0.5;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1 && this.isSelected) {
                const bounceProgress = Math.sin(progress * Math.PI * 2);
                this.group.position.y = startY + bounceProgress * bounceHeight;
                requestAnimationFrame(animate);
            } else {
                this.group.position.y = startY;
                if (this.isSelected) {
                    requestAnimationFrame(animate);
                }
            }
        };

        animate();
    }

    moveTo(position, duration = 500) {
        return new Promise((resolve) => {
            const startPos = {
                x: this.group.position.x,
                z: this.group.position.z
            };
            const endPos = { x: position.x, z: position.z };
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeProgress = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                this.group.position.x = startPos.x + (endPos.x - startPos.x) * easeProgress;
                this.group.position.z = startPos.z + (endPos.z - startPos.z) * easeProgress;
                
                // Add jump effect
                const jumpHeight = Math.sin(progress * Math.PI) * 1.5;
                this.group.position.y = 0.5 + jumpHeight;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.group.position.y = 0.5;
                    resolve();
                }
            };

            animate();
        });
    }

    async captureAnimation() {
        // Spin and shrink animation for captured piece
        const duration = 500;
        const startTime = Date.now();
        const startScale = 1;

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                this.group.rotation.y = progress * Math.PI * 4;
                const scale = startScale * (1 - progress);
                this.group.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    async returnToHome(homePosition) {
        // Reset scale and rotation
        this.group.scale.set(1, 1, 1);
        this.group.rotation.y = 0;
        
        await this.moveTo(homePosition, 800);
        this.position = -1;
        this.isInWinningPath = false;
        this.winningPathIndex = -1;
    }

    celebrate() {
        // Victory animation
        const duration = 2000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                this.group.rotation.y = progress * Math.PI * 8;
                const bounce = Math.sin(progress * Math.PI * 8) * 0.5;
                this.group.position.y = 0.5 + Math.abs(bounce);
                requestAnimationFrame(animate);
            } else {
                this.group.rotation.y = 0;
                this.group.position.y = 0.5;
            }
        };

        animate();
    }

    remove() {
        this.scene.remove(this.group);
    }
}

class PieceManager {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.pieces = {};
        this.colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f];
        
        this.initializePieces();
    }

    initializePieces() {
        for (let playerId = 0; playerId < 4; playerId++) {
            this.pieces[playerId] = [];
            
            for (let pieceIndex = 0; pieceIndex < 4; pieceIndex++) {
                const homePos = this.board.getHomePosition(playerId, pieceIndex);
                const piece = new GamePiece(
                    this.scene,
                    playerId,
                    pieceIndex,
                    this.colors[playerId],
                    homePos
                );
                this.pieces[playerId].push(piece);
            }
        }
    }

    getPiece(playerId, pieceIndex) {
        return this.pieces[playerId][pieceIndex];
    }

    getPlayerPieces(playerId) {
        return this.pieces[playerId];
    }

    getAllPieces() {
        const allPieces = [];
        for (let playerId = 0; playerId < 4; playerId++) {
            allPieces.push(...this.pieces[playerId]);
        }
        return allPieces;
    }

    deselectAll() {
        this.getAllPieces().forEach(piece => {
            piece.setSelected(false);
        });
    }

    async movePiece(playerId, pieceIndex, newPosition, isWinningPath = false, winningPathIndex = -1) {
        const piece = this.getPiece(playerId, pieceIndex);
        
        let targetPos;
        if (isWinningPath) {
            targetPos = this.board.getWinningPosition(playerId, winningPathIndex);
            piece.isInWinningPath = true;
            piece.winningPathIndex = winningPathIndex;
        } else {
            targetPos = this.board.getPathPosition(newPosition);
            piece.position = newPosition;
        }

        if (targetPos) {
            await piece.moveTo(targetPos);
        }
    }

    async capturePiece(playerId, pieceIndex) {
        const piece = this.getPiece(playerId, pieceIndex);
        await piece.captureAnimation();
        
        const homePos = this.board.getHomePosition(playerId, pieceIndex);
        await piece.returnToHome(homePos);
    }

    getPieceAtPosition(position, excludePlayer = -1) {
        for (let playerId = 0; playerId < 4; playerId++) {
            if (playerId === excludePlayer) continue;
            
            for (const piece of this.pieces[playerId]) {
                if (!piece.isInWinningPath && piece.position === position) {
                    return { playerId, pieceIndex: piece.pieceIndex };
                }
            }
        }
        return null;
    }

    getFinishedPiecesCount(playerId) {
        return this.pieces[playerId].filter(piece => piece.hasFinished).length;
    }
}
