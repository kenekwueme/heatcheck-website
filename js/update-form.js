/* =========================================================
   HEAT CHECK - PLAYER UPDATE WIZARD
   ========================================================= */

let currentStep = 1;
const totalSteps = 6;

// Modal Controls
function openWizard() {
  document.getElementById('wizardOverlay').classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeWizard() {
  document.getElementById('wizardOverlay').classList.remove('active');
  document.body.style.overflow = ''; 
}

function resetWizard() {
  document.getElementById('playerUpdateForm').reset();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('fname_profile').innerText = '';
  document.getElementById('fname_id').innerText = '';
  
  document.getElementById('wizardMainUI').style.display = 'block';
  document.getElementById('wizardSuccessUI').style.display = 'none';
  
  goToStep(1);
}

// Navigation
document.getElementById('btnWizNext').addEventListener('click', () => {
  if (validateStep(currentStep)) {
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    }
  }
});

document.getElementById('btnWizBack').addEventListener('click', () => {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
});

function goToStep(step) {
  // Hide all
  document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.step-indicator').forEach(el => {
    el.classList.remove('active');
    if (parseInt(el.id.split('-')[1]) < step) {
      el.classList.add('completed');
    } else {
      el.classList.remove('completed');
    }
  });

  // Show target
  document.getElementById(`step-${step}`).classList.add('active');
  document.getElementById(`ind-${step}`).classList.add('active');
  
  // Progress Bar
  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;
  document.getElementById('progressFill').style.width = `${progressPercent}%`;

  // Buttons
  const btnBack = document.getElementById('btnWizBack');
  const btnNext = document.getElementById('btnWizNext');
  const btnSubmit = document.getElementById('btnWizSubmit');

  btnBack.disabled = (step === 1);
  
  if (step === totalSteps) {
    btnNext.style.display = 'none';
    btnSubmit.style.display = 'block';
    generateReview();
  } else {
    btnNext.style.display = 'block';
    btnSubmit.style.display = 'none';
  }

  currentStep = step;
}

// Validation Engine
function validateStep(step) {
  let isValid = true;
  const container = document.getElementById(`step-${step}`);
  
  // Clear previous errors
  container.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
  container.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  // Find all required inputs in this step
  const requiredInputs = container.querySelectorAll('[required]');
  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('error');
      const errorMsg = input.nextElementSibling;
      if (errorMsg && errorMsg.classList.contains('error-msg')) {
        errorMsg.style.display = 'block';
      }
    }
  });

  // Specific validations
  if (step === 1) {
    const email = document.getElementById('wu_email');
    if (email.value && !email.value.includes('@')) {
      isValid = false;
      email.classList.add('error');
      email.nextElementSibling.style.display = 'block';
    }
  }

  return isValid;
}

// Chip Interactions
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', function() {
    const parent = this.parentElement;
    
    // Playing role limit to 3
    if (parent.id === 'chipGroupRole') {
      if (!this.classList.contains('selected')) {
        const selectedCount = parent.querySelectorAll('.selected').length;
        if (selectedCount >= 3) return; // limit reached
      }
    }

    // National team exclusive 'None' logic
    if (parent.id === 'chipGroupNational' || parent.id === 'chipGroupBal') {
      if (this.dataset.val === 'None') {
        parent.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        return;
      } else {
        const noneChip = Array.from(parent.children).find(c => c.dataset.val === 'None');
        if (noneChip) noneChip.classList.remove('selected');
      }
    }

    this.classList.toggle('selected');
  });
});

// File Upload visual
document.getElementById('wu_file_profile').addEventListener('change', function(e) {
  document.getElementById('fname_profile').innerText = e.target.files[0] ? e.target.files[0].name : '';
});
document.getElementById('wu_file_id').addEventListener('change', function(e) {
  document.getElementById('fname_id').innerText = e.target.files[0] ? e.target.files[0].name : '';
});

// Generate Review Screen
function generateReview() {
  const block = document.getElementById('reviewBlock');
  
  const data = [
    { label: "Name", val: document.getElementById('wu_fullname').value },
    { label: "DOB", val: document.getElementById('wu_dob').value },
    { label: "Team", val: document.getElementById('wu_team').value },
    { label: "League", val: document.getElementById('wu_league').value },
    { label: "Primary Position", val: document.getElementById('wu_pos_1').value },
    { label: "Height", val: document.getElementById('wu_height').value },
  ];

  let html = '';
  data.forEach(item => {
    html += `<div class="review-item"><span class="review-lbl">${item.label}</span><span class="review-val">${item.val || '-'}</span></div>`;
  });

  block.innerHTML = `<div class="review-title">Summary</div>` + html;
}

// Helpers
function getSelectedChips(groupId) {
  return Array.from(document.getElementById(groupId).querySelectorAll('.chip.selected')).map(c => c.innerText);
}
function getFile(id) {
  const el = document.getElementById(id);
  return el.files.length > 0 ? el.files[0].name : "";
}

// Submission Logic
document.getElementById('btnWizSubmit').addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Validate checkboxes
  const chk1 = document.getElementById('wu_chk_accuracy').checked;
  const chk2 = document.getElementById('wu_chk_privacy').checked;
  
  if (!chk1 || !chk2) {
    document.getElementById('submitErrorMsg').style.display = 'block';
    return;
  }
  document.getElementById('submitErrorMsg').style.display = 'none';

  // Change button state
  const btn = document.getElementById('btnWizSubmit');
  btn.innerText = "Submitting...";
  btn.style.opacity = '0.7';
  btn.style.pointerEvents = 'none';

  // Build JSON Schema
  const submissionPayload = {
    submission_id: "hc_" + Date.now().toString(36),
    submission_type: "player_profile_update",
    submitted_at: new Date().toISOString(),
    review_status: "pending_review",
    player: {
      full_name: document.getElementById('wu_fullname').value,
      nickname: document.getElementById('wu_nickname').value,
      date_of_birth: document.getElementById('wu_dob').value,
      nationality: document.getElementById('wu_nationality').value,
      state_of_origin: document.getElementById('wu_state').value,
      current_location: document.getElementById('wu_city').value,
      email: document.getElementById('wu_email').value,
      phone: document.getElementById('wu_phone').value,
      instagram: document.getElementById('wu_ig').value,
      primary_position: document.getElementById('wu_pos_1').value,
      secondary_position: document.getElementById('wu_pos_2').value,
      height: document.getElementById('wu_height').value,
      weight: document.getElementById('wu_weight').value,
      dominant_hand: document.getElementById('wu_hand').value,
      playing_roles: getSelectedChips('chipGroupRole'),
      current_team: document.getElementById('wu_team').value,
      current_league: document.getElementById('wu_league').value,
      conference: document.getElementById('wu_conference').value,
      jersey_number: document.getElementById('wu_jersey').value,
      current_status: document.getElementById('wu_status').value,
      previous_teams: document.getElementById('wu_prev_teams').value,
      national_team_experience: getSelectedChips('chipGroupNational'),
      continental_experience: getSelectedChips('chipGroupBal'),
      latest_season_stats: document.getElementById('wu_stats_overview').value,
      games_played: document.getElementById('wu_gp').value,
      ppg: document.getElementById('wu_ppg').value,
      rpg: document.getElementById('wu_rpg').value,
      apg: document.getElementById('wu_apg').value,
      spg: document.getElementById('wu_def').value.split('/')[0] || "", // Basic parsing
      bpg: document.getElementById('wu_def').value.split('/')[1] || "",
      fg_percentage: document.getElementById('wu_pct').value.split('/')[0] || "",
      three_point_percentage: document.getElementById('wu_pct').value.split('/')[1] || "",
      ft_percentage: document.getElementById('wu_pct').value.split('/')[2] || "",
      career_highlights: document.getElementById('wu_highlights').value,
      proof_links: document.getElementById('wu_proof_links').value.split('\n').filter(l => l.trim() !== ""),
      highlight_video: document.getElementById('wu_video').value,
      fields_to_update: getSelectedChips('chipGroupCorrection'),
      update_description: document.getElementById('wu_desc').value,
      verification_contact_name: document.getElementById('wu_coach_name').value,
      verification_contact_details: document.getElementById('wu_coach_contact').value
    },
    files: {
      profile_photo: getFile('wu_file_profile'),
      verification_document: getFile('wu_file_id')
    },
    consent: {
      accuracy_confirmed: true,
      permission_to_publish: true,
      privacy_acknowledged: true
    }
  };

  // Mock API Call & Success State
  console.log("🏀 HeatCheck Form Submission Payload:");
  console.log(JSON.stringify(submissionPayload, null, 2));

  setTimeout(() => {
    // Hide UI, Show Success
    document.getElementById('wizardMainUI').style.display = 'none';
    document.getElementById('wizardSuccessUI').style.display = 'flex';
    
    // Reset btn
    btn.innerText = "Submit Profile Update";
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }, 1200);

});
