from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0016_merge_20260318_1258"),
    ]

    operations = [
        migrations.CreateModel(
            name="Event",
            fields=[
                ("event_id", models.AutoField(primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=100)),
                ("date", models.DateTimeField()),
                ("reminder", models.CharField(blank=True, max_length=255, null=True)),
                ("car", models.ForeignKey(on_delete=models.deletion.CASCADE, to="AutoApp.car")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, to="AutoApp.user")),
            ],
            options={
                "db_table": "event",
            },
        ),
    ]
