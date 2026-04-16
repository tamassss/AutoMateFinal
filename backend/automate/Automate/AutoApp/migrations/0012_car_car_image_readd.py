from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0011_community_models_and_moderator_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="car",
            name="car_image",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
