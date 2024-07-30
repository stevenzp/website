document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.body.style.background = 'url(' + canvas.toDataURL() + ')';
    const particles = [];
    const comets = [];
    const colors = ['#FF6347', '#FF4500', '#FFD700', '#ADFF2F', '#00FF00', '#00FA9A', '#00CED1', '#1E90FF', '#FF69B4', '#FF1493'];

    let noiseSeed = Math.random() * 1000;
    let mouse = { x: null, y: null };
    const maxCometGroups = 5;

    function perlinNoise(x, y) {
        let n = noiseSeed + x * 0.01 + y * 0.01;
        return Math.sin(n * Math.PI * 2);
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 10 + 5;
            this.speedX = (Math.random() - 0.5) * 6;
            this.speedY = (Math.random() - 0.5) * 6;
            this.noiseOffsetX = Math.random() * 1000;
            this.noiseOffsetY = Math.random() * 1000;
        }

        update() {
            const noiseFactorX = perlinNoise(this.noiseOffsetX, this.noiseOffsetY);
            const noiseFactorY = perlinNoise(this.noiseOffsetY, this.noiseOffsetX);

            this.x += this.speedX + noiseFactorX * 2;
            this.y += this.speedY + noiseFactorY * 2;

            this.noiseOffsetX += 0.01;
            this.noiseOffsetY += 0.01;

            this.size *= 0.95;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class Comet {
        constructor(x, y, speedX, speedY, color) {
            this.x = x;
            this.y = y;
            this.initialSpeedX = speedX * 0.7;
            this.initialSpeedY = speedY * 0.7;
            this.speedX = speedX;
            this.speedY = speedY;
            this.color = color;
            this.particles = [];
            this.speedUpTimer = 0;
            this.normalSpeedDuration = Math.random() * 100 + 50; // Random duration for normal speed
            this.speedUpDuration = Math.random() * 50 + 25; // Random duration for speed up
        }

        update() {
            this.speedUpTimer++;

            if (this.speedUpTimer < this.normalSpeedDuration) {
                // Normal speed
                this.speedX = this.initialSpeedX;
                this.speedY = this.initialSpeedY;
            } else if (this.speedUpTimer < this.normalSpeedDuration + this.speedUpDuration) {
                // Speed up
                this.speedX = this.initialSpeedX * 1.2;
                this.speedY = this.initialSpeedY * 1.2;
            } else {
                // Reset timer
                this.speedUpTimer = 0;
                this.normalSpeedDuration = Math.random() * 100 + 50;
                this.speedUpDuration = Math.random() * 50 + 25;
            }

            this.x += this.speedX;
            this.y += this.speedY;
            this.particles.push(new Particle(this.x, this.y, this.color));

            if (this.particles.length > 20) {
                this.particles.shift();
            }

            this.particles.forEach(particle => {
                particle.update();
            });
        }

        draw() {
            this.particles.forEach((particle, index) => {
                ctx.globalAlpha = 1 - index / this.particles.length;
                particle.draw();
            });
            ctx.globalAlpha = 1;
        }
    }

    function createExplosion(x, y, color1, color2) {
        const numParticles = 30; // Reduce the number of particles
        const blendedColor = blendColors(color1, color2, 0.5);
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle(x, y, blendedColor));
        }
    }

    function blendColors(color1, color2, weight) {
        function hexToRgb(hex) {
            const bigint = parseInt(hex.slice(1), 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return [r, g, b];
        }

        function rgbToHex(r, g, b) {
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }

        const [r1, g1, b1] = hexToRgb(color1);
        const [r2, g2, b2] = hexToRgb(color2);

        const r = Math.round(r1 * (1 - weight) + r2 * weight);
        const g = Math.round(g1 * (1 - weight) + g2 * weight);
        const b = Math.round(b1 * (1 - weight) + b2 * weight);

        return rgbToHex(r, g, b);
    }

    function detectCollisions() {
        for (let i = 0; i < comets.length; i++) {
            for (let j = i + 1; j < comets.length; j++) {
                const dx = comets[i].x - comets[j].x;
                const dy = comets[i].y - comets[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 70) { // Collision threshold
                    createExplosion((comets[i].x + comets[j].x) / 2, (comets[i].y + comets[j].y) / 2, comets[i].color, comets[j].color);
                    comets.splice(j, 1);
                    comets.splice(i, 1);
                    return; // Exit to avoid further processing
                }
            }
        }
    }

    function createCometGroup() {
        const numComets = Math.floor(Math.random() * 2) + 1; // Limit the number of comets
        const minDistance = 100; // Minimum distance between comets

        for (let i = 0; i < numComets; i++) {
            let x, y, speedX, speedY, isValidPosition;

            do {
                isValidPosition = true;
                const edge = Math.floor(Math.random() * 4);

                switch (edge) {
                    case 0: // Left
                        x = -50;
                        y = Math.random() * canvas.height;
                        speedX = Math.random() * 1.5 + 1;
                        speedY = (Math.random() - 0.5) * 1.5;
                        break;
                    case 1: // Right
                        x = canvas.width + 50;
                        y = Math.random() * canvas.height;
                        speedX = -(Math.random() * 1.5 + 1);
                        speedY = (Math.random() - 0.5) *1.5;
                        break;
                    case 2: // Top
                        x = Math.random() * canvas.width;
                        y = -50;
                        speedX = (Math.random() - 0.5) * 1.5;
                        speedY = Math.random() * 1.5 + 1;
                        break;
                    case 3: // Bottom
                        x = Math.random() * canvas.width;
                        y = canvas.height + 50;
                        speedX = (Math.random() - 0.5) * 1.5;
                        speedY = -(Math.random() * 1.5 + 1);
                        break;
                }

                // Check distance from existing comets
                for (const comet of comets) {
                    const dx = comet.x - x;
                    const dy = comet.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        isValidPosition = false;
                        break;
                    }
                }
            } while (!isValidPosition);

            const color = colors[Math.floor(Math.random() * colors.length)];
            comets.push(new Comet(x, y, speedX, speedY, color));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle, index) => {
            particle.update();
            particle.draw();
            if (particle.size < 0.3) {
                particles.splice(index, 1);
            }
        });
        comets.forEach((comet, index) => {
            comet.update();
            comet.draw();
            if (comet.x < -100 || comet.x > canvas.width + 100 || comet.y < -100 || comet.y > canvas.height + 100) {
                comets.splice(index, 1);
            }
        });
        detectCollisions();
        checkMouseProximity();
        requestAnimationFrame(animate);
    }

    function checkMouseProximity() {
        const proximityThreshold = 50;
        comets.forEach((comet, index) => {
            const dx = comet.x - mouse.x;
            const dy = comet.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < proximityThreshold) {
                comets.splice(index, 1);
                createExplosion(comet.x, comet.y, comet.color, comet.color);
            }
        });
    }

    // Randomly create comets
    setInterval(() => {
        if (comets.length < maxCometGroups) {
            createCometGroup();
        }
    }, 3000);

    // Initial creation of comet group
    createCometGroup();

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    canvas.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    const toggleButton = document.getElementById('toggleComets');
    let cometsVisible = true;

    toggleButton.addEventListener('click', () => {
        if (cometsVisible) {
            // Trigger all comets to collide and explode
            comets.forEach((comet) => {
                createExplosion(comet.x, comet.y, comet.color, comet.color);
            });
            comets.length = 0; // Clear all comets

            // Add a delay before hiding the canvas to show the explosion effect
            setTimeout(() => {
                canvas.style.display = 'none';
                toggleButton.textContent = 'Show Comets';
            }, 1300); // Adjust delay as needed
        } else {
            canvas.style.display = 'block';
            toggleButton.textContent = 'Hide Comets';
        }
        cometsVisible = !cometsVisible;
    });


});
