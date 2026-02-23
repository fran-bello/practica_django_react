# Add category to Subtask

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_add_subtask_and_due_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='subtask',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='subtasks',
                to='tasks.category',
            ),
        ),
    ]
