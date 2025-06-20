document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('avistamento-form');
    const possuiRegistroRadios = document.querySelectorAll('input[name="possui-registro"]');
    const uploadGroup = document.getElementById('upload-group');
    const arquivoInput = document.getElementById('arquivo');
    const fileError = document.getElementById('file-error');
    const outrasExperienciasRadios = document.querySelectorAll('input[name="outras-experiencias"]');
    const experienciasGroup = document.getElementById('experiencias-group');
    const submitBtn = document.querySelector('.submit-btn');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Mostrar/ocultar campo de upload de arquivo
    possuiRegistroRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'sim') {
                uploadGroup.style.display = 'block';
                uploadGroup.style.animation = 'fadeInUp 0.5s ease-out';
            } else {
                uploadGroup.style.display = 'none';
                arquivoInput.value = '';
                fileError.style.display = 'none';
            }
        });
    });

    // Mostrar/ocultar campo de descrição de outras experiências
    outrasExperienciasRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'sim') {
                experienciasGroup.style.display = 'block';
                experienciasGroup.style.animation = 'fadeInUp 0.5s ease-out';
            } else {
                experienciasGroup.style.display = 'none';
                document.getElementById('descricao-experiencias').value = '';
            }
        });
    });

    // Validação de arquivo
    arquivoInput.addEventListener('change', function() {
        const file = this.files[0];
        fileError.style.display = 'none';

        if (file) {
            // Verificar tamanho (25MB = 25 * 1024 * 1024 bytes)
            const maxSize = 25 * 1024 * 1024;
            if (file.size > maxSize) {
                showFileError('O tamanho do arquivo excede o limite de 25 MB. Por favor, envie um arquivo menor.');
                this.value = '';
                return;
            }

            // Verificar formato
            const allowedTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'video/mp4', 'video/mov', 'video/quicktime', 'video/avi', 'video/x-msvideo'
            ];
            
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'];
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                showFileError('Formato de arquivo não aceito. Por favor, envie um arquivo nas extensões JPG, PNG, GIF, MP4, MOV ou AVI.');
                this.value = '';
                return;
            }

            // Mostrar informações do arquivo
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <p style="color: #00b894; margin-top: 10px; font-weight: 600;">
                    ✓ Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})
                </p>
            `;
            
            // Remover informação anterior se existir
            const existingInfo = this.parentNode.querySelector('.file-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            this.parentNode.appendChild(fileInfo);
        }
    });

    // Validação de data e hora (removida - agora usa campos nativos HTML5)
    // Os campos de data e hora agora usam input type="date" e type="time"
    // que já têm validação nativa do navegador

    // Validação de e-mail/telefone de contato
    const contatoInput = document.getElementById('contato');
    contatoInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !isValidContact(value)) {
            this.style.borderColor = '#e17055';
            showFieldError(this, 'Formato inválido. Use um e-mail válido ou telefone no formato (XX) XXXXX-XXXX');
        } else {
            this.style.borderColor = '#ddd';
            hideFieldError(this);
        }
    });

    // Submissão do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar campos obrigatórios
        if (!validateForm()) {
            return;
        }

        // Mostrar loading
        showLoading();

        try {
            const formData = new FormData(form);
            
            const response = await fetch('/submit-form', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showSuccess();
                form.reset();
                uploadGroup.style.display = 'none';
                experienciasGroup.style.display = 'none';
            } else {
                showError(result.message || 'Erro ao enviar o formulário. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro:', error);
            showError('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            hideLoading();
        }
    });

    // Funções auxiliares
    function showFileError(message) {
        fileError.textContent = message;
        fileError.style.display = 'block';
        fileError.style.color = '#e17055';
        fileError.style.fontWeight = '600';
        fileError.style.marginTop = '10px';
    }

    function showFieldError(field, message) {
        hideFieldError(field);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e17055';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.fontWeight = '600';
        field.parentNode.appendChild(errorDiv);
    }

    function hideFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    function isValidContact(contact) {
        // Validar e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Validar telefone brasileiro
        const phoneRegex = /^\(\d{2}\)\s*\d{4,5}-?\d{4}$/;
        
        return emailRegex.test(contact) || phoneRegex.test(contact);
    }

    function validateForm() {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                const radioGroup = form.querySelectorAll(`[name="${field.name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                if (!isChecked) {
                    isValid = false;
                    highlightFieldGroup(radioGroup[0]);
                }
            } else if (!field.value.trim()) {
                isValid = false;
                highlightField(field);
            }
        });

        // Validar arquivo se "possui registro" for "sim"
        const possuiRegistro = form.querySelector('input[name="possui-registro"]:checked');
        if (possuiRegistro && possuiRegistro.value === 'sim') {
            if (!arquivoInput.files[0]) {
                isValid = false;
                showFileError('Por favor, selecione um arquivo.');
            }
        }

        if (!isValid) {
            showError('Por favor, preencha todos os campos obrigatórios.');
            // Scroll para o primeiro campo com erro
            const firstError = form.querySelector('.error-highlight, .field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    }

    function highlightField(field) {
        field.style.borderColor = '#e17055';
        field.classList.add('error-highlight');
        
        setTimeout(() => {
            field.style.borderColor = '#ddd';
            field.classList.remove('error-highlight');
        }, 3000);
    }

    function highlightFieldGroup(field) {
        const group = field.closest('.form-group');
        if (group) {
            group.style.backgroundColor = '#ffebee';
            group.style.borderRadius = '8px';
            group.style.padding = '15px';
            
            setTimeout(() => {
                group.style.backgroundColor = '';
                group.style.padding = '';
            }, 3000);
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showLoading() {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span>Enviando...';
    }

    function hideLoading() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enviar Relato';
    }

    function showSuccess() {
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ocultar após 10 segundos
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 10000);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ocultar após 8 segundos
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 8000);
    }

    // Adicionar efeitos visuais aos campos
    const inputs = form.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.style.transform = 'translateY(-2px)';
            this.parentNode.style.transition = 'transform 0.3s ease';
        });

        input.addEventListener('blur', function() {
            this.parentNode.style.transform = 'translateY(0)';
        });
    });

    // Adicionar animação aos radio buttons
    const radioLabels = form.querySelectorAll('.radio-label');
    radioLabels.forEach(label => {
        label.addEventListener('click', function() {
            // Remover seleção visual de outros radios do mesmo grupo
            const radioName = this.querySelector('input[type="radio"]').name;
            const sameGroupLabels = form.querySelectorAll(`input[name="${radioName}"]`);
            sameGroupLabels.forEach(radio => {
                radio.closest('.radio-label').classList.remove('selected');
            });
            
            // Adicionar seleção visual ao atual
            this.classList.add('selected');
        });
    });

    // Adicionar contador de caracteres para textareas
    const textareas = form.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.textAlign = 'right';
        counter.style.fontSize = '0.8rem';
        counter.style.color = '#666';
        counter.style.marginTop = '5px';
        
        textarea.parentNode.appendChild(counter);
        
        function updateCounter() {
            const length = textarea.value.length;
            counter.textContent = `${length} caracteres`;
            
            if (length > 1000) {
                counter.style.color = '#e17055';
            } else if (length > 500) {
                counter.style.color = '#fdcb6e';
            } else {
                counter.style.color = '#666';
            }
        }
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    });

    // Adicionar validação em tempo real
    const allInputs = form.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.checkValidity()) {
                this.style.borderColor = '#00b894';
            } else {
                this.style.borderColor = '#e17055';
            }
        });
    });
});

