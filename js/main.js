$(function () {
  const session = {};
  session.tasks = [];

  console.log('CheckerBuddy Loading...');

  const correctionFunc = function (taskId) {
    console.log('correctionFunc() taskId:', taskId);
    const correctionRequest = {
      async: true,
      crossDomain: true,
      url: `https://intranet.hbtn.io/tasks/${taskId}/start_correction.json?auth_token=${session.auth_token}`,
      method: 'POST'
    };
    $.ajax(correctionRequest).done(function (data) {
      console.log('CORRECTION:', data);
      session.tasks[taskId] = data.id;

      const pollResult = function () {
        console.log('POLLING:', data.id);
        const resultRequest = {
          async: true,
          crossDomain: true,
          url: `https://intranet.hbtn.io/correction_requests/${data.id}.json?auth_token=${session.auth_token}`,
          method: 'GET'
        };
        $.ajax(resultRequest).done(function (data) {
          console.log('POLL RESULT:', data);
          if (data.status !== 'Done') {
            setTimeout(pollResult, 2000);
          } else {
            /* collect checker data */
            const requirements = [];
            const outputs = [];
            for (const check of data.result_display.checks) {
              if (check.check_label === 'requirement') {
                requirements.push(check.passed);
              } else if (check.check_label === 'code') {
                outputs.push(check.passed);
              }
            }
            const requirementsStr = requirements.map(x => x ? '+' : '-').join('');
            const outputsStr = outputs.map(x => x ? '+' : '-').join('');

            /* Append data to task list element */
            $('li.task').each(function (index) {
              if ($(this).attr('task-id') === data.task_id.toString()) {
                $(this).children().remove();
                $(this).append(`<div><i>Requirements: ${requirementsStr}</i></div>`);
                $(this).append(`<div><i>Outputs: ${outputsStr}</i></div>`);
              }
            });
          }
        });
      };
      pollResult();
    });
  };

  $(document).on('click', 'input[value=Next]', function () {
    console.log('LOGIN');
    const json = {
      api_key: $('input[name=api]').val(),
      email: $('input[name=email]').val(),
      password: $('input[name=password]').val(),
      scope: 'checker'
    };

    const authenticationRequest = {
      async: true,
      crossDomain: true,
      url: 'https://intranet.hbtn.io/users/auth_token.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(json)
    };
    $.ajax(authenticationRequest).done(function (data) {
      console.log('AUTH:', data);
      if (data.auth_token) {
        session.auth_token = data.auth_token;
        $('div#validating').hide();
        $('input[name=next]').val("Play");
      }
    });
  });

  $(document).on('click', 'input[value=Play]', function () {
    const projectId = $('input[name=project]').val();
    console.log('Play:', projectId);

    const projectRequest = {
      async: true,
      crossDomain: true,
      url: `https://intranet.hbtn.io/projects/${projectId}.json?auth_token=${session.auth_token}`,
      method: 'GET'
    };
    $.ajax(projectRequest).done(function (data) {
      console.log('PROJECT:', data);
      $('#task_header').html(data.name);
      $('#task_list').empty();
      for (const task of data.tasks) {
        $('#task_list').append(`<li class='task' task-id='${task.id}'>${task.title}</li>`);
      }
    });
  });

  $(document).on('click', 'li.task', function () {
    correctionFunc($(this).attr('task-id'));
  });

  $(document).on('click', '#task_header', function () {
    $('li.task').each((i, e) => correctionFunc(e.getAttribute('task-id')));
  });
});
